import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  console.log('Daily poll management triggered:', JSON.stringify(event, null, 2));

  try {
    const now = new Date();
    console.log('Current time (UTC):', now.toISOString());

    // ========================================
    // STEP 1: Close expired poll instances
    // ========================================
    console.log('Step 1: Closing expired poll instances...');
    
    const allInstancesResult = await docClient.send(
      new ScanCommand({
        TableName: process.env.POLL_INSTANCES_TABLE,
        FilterExpression: '#status IN (:active, :scheduled)',
        ExpressionAttributeNames: {
          '#status': 'Status',
        },
        ExpressionAttributeValues: {
          ':active': 'Active',
          ':scheduled': 'Scheduled',
        },
      })
    );

    const instancesToClose = (allInstancesResult.Items || []).filter((instance) => {
      const endDate = new Date(instance.EndDate);
      return endDate <= now && instance.Status === 'Active';
    });

    console.log(`Found ${instancesToClose.length} instances to close`);

    for (const instance of instancesToClose) {
      await docClient.send(
        new UpdateCommand({
          TableName: process.env.POLL_INSTANCES_TABLE,
          Key: {
            PK: instance.PK,
            SK: instance.SK,
          },
          UpdateExpression: 'SET #status = :closed, ClosedAt = :now',
          ExpressionAttributeNames: {
            '#status': 'Status',
          },
          ExpressionAttributeValues: {
            ':closed': 'Closed',
            ':now': now.toISOString(),
          },
        })
      );
      console.log(`Closed instance: ${instance.SK} (Poll: ${instance.PK})`);
    }

    // ========================================
    // STEP 2: Activate scheduled poll instances
    // ========================================
    console.log('Step 2: Activating scheduled poll instances...');

    const instancesToActivate = (allInstancesResult.Items || []).filter((instance) => {
      const startDate = new Date(instance.StartDate);
      return startDate <= now && instance.Status === 'Scheduled';
    });

    console.log(`Found ${instancesToActivate.length} instances to activate`);

    for (const instance of instancesToActivate) {
      await docClient.send(
        new UpdateCommand({
          TableName: process.env.POLL_INSTANCES_TABLE,
          Key: {
            PK: instance.PK,
            SK: instance.SK,
          },
          UpdateExpression: 'SET #status = :active, ActivatedAt = :now',
          ExpressionAttributeNames: {
            '#status': 'Status',
          },
          ExpressionAttributeValues: {
            ':active': 'Active',
            ':now': now.toISOString(),
          },
        })
      );
      console.log(`Activated instance: ${instance.SK} (Poll: ${instance.PK})`);
    }

    // ========================================
    // STEP 3: Create next instance for recurring polls
    // ========================================
    console.log('Step 3: Creating next instances for recurring polls...');

    const pollsResult = await docClient.send(
      new ScanCommand({
        TableName: process.env.POLLS_TABLE,
        FilterExpression: 'IsRecurring = :true',
        ExpressionAttributeValues: {
          ':true': true,
        },
      })
    );

    const recurringPolls = pollsResult.Items || [];
    console.log(`Found ${recurringPolls.length} recurring polls`);

    for (const poll of recurringPolls) {
      // Check if poll has reached its EndDate
      if (poll.EndDate && new Date(poll.EndDate) < now) {
        console.log(`Poll ${poll.PK} has reached its end date, skipping...`);
        continue;
      }

      // Get all instances for this poll
      const instancesResult = await docClient.send(
        new QueryCommand({
          TableName: process.env.POLL_INSTANCES_TABLE,
          KeyConditionExpression: 'PK = :pollId',
          ExpressionAttributeValues: {
            ':pollId': poll.PK,
          },
          ScanIndexForward: false, // Get latest first
        })
      );

      const instances = instancesResult.Items || [];
      
      if (instances.length === 0) {
        console.log(`No instances found for poll ${poll.PK}, skipping...`);
        continue;
      }

      // Find the latest instance (by EndDate)
      const latestInstance = instances.reduce((latest, current) => {
        const latestEndDate = new Date(latest.EndDate);
        const currentEndDate = new Date(current.EndDate);
        return currentEndDate > latestEndDate ? current : latest;
      });

      const latestEndDate = new Date(latestInstance.EndDate);

      // Check if we need to create a new instance
      // Create new instance if the latest one ends within the next day
      const oneDayFromNow = new Date(now);
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

      if (latestEndDate > oneDayFromNow) {
        console.log(`Latest instance for poll ${poll.PK} doesn't end soon, skipping...`);
        continue;
      }

      // Calculate next instance dates
      const nextStartDate = new Date(latestEndDate);
      nextStartDate.setSeconds(nextStartDate.getSeconds() + 1); // Start 1 second after previous ends

      const nextEndDate = new Date(nextStartDate);
      nextEndDate.setDate(nextEndDate.getDate() + poll.DurationDays);

      // Get approved suggestions to merge
      const suggestionsResult = await docClient.send(
        new QueryCommand({
          TableName: process.env.SUGGESTIONS_TABLE,
          KeyConditionExpression: 'PK = :pollId',
          FilterExpression: '#status = :approved',
          ExpressionAttributeNames: {
            '#status': 'Status',
          },
          ExpressionAttributeValues: {
            ':pollId': poll.PK,
            ':approved': 'Approved',
          },
        })
      );

      const approvedSuggestions = suggestionsResult.Items || [];
      console.log(`Found ${approvedSuggestions.length} approved suggestions for poll ${poll.PK}`);

      // Merge base options with approved suggestions
      const baseOptions = latestInstance.OptionsSnapshot || [];
      const newOptions = [
        ...baseOptions,
        ...approvedSuggestions.map((suggestion) => ({
          id: randomUUID(),
          text: suggestion.Text,
          votes: 0,
        })),
      ];

      // Determine if new instance should be scheduled or active
      const shouldBeActive = nextStartDate <= now;

      // Create new instance
      const newInstanceId = randomUUID();
      const newInstance = {
        PK: poll.PK,
        SK: newInstanceId,
        Status: shouldBeActive ? 'Active' : 'Scheduled',
        StartDate: nextStartDate.toISOString(),
        EndDate: nextEndDate.toISOString(),
        OptionsSnapshot: newOptions,
        CreatedAt: now.toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: process.env.POLL_INSTANCES_TABLE,
          Item: newInstance,
        })
      );

      console.log(
        `Created new ${shouldBeActive ? 'active' : 'scheduled'} instance ${newInstanceId} for poll ${poll.PK}` +
        ` (${nextStartDate.toISOString()} - ${nextEndDate.toISOString()})`
      );

      // Mark suggestions as used
      for (const suggestion of approvedSuggestions) {
        await docClient.send(
          new UpdateCommand({
            TableName: process.env.SUGGESTIONS_TABLE,
            Key: {
              PK: suggestion.PK,
              SK: suggestion.SK,
            },
            UpdateExpression: 'SET #status = :used, UsedAt = :now',
            ExpressionAttributeNames: {
              '#status': 'Status',
            },
            ExpressionAttributeValues: {
              ':used': 'Used',
              ':now': now.toISOString(),
            },
          })
        );
      }
    }

    console.log('Daily poll management completed successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Poll management completed',
        closed: instancesToClose.length,
        activated: instancesToActivate.length,
        newInstancesCreated: recurringPolls.length,
      }),
    };
  } catch (error: any) {
    console.error('Recurrence error:', error);
    throw error;
  }
};
