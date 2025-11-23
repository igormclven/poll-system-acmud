import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const pollId = event.pathParameters?.pollId;

    if (!pollId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Poll ID is required' }),
      };
    }

    // Get poll details
    const pollResult = await docClient.send(
      new GetCommand({
        TableName: process.env.POLLS_TABLE,
        Key: { PK: pollId },
      })
    );

    if (!pollResult.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Poll not found' }),
      };
    }

    // Get active instance
    const instancesResult = await docClient.send(
      new QueryCommand({
        TableName: process.env.POLL_INSTANCES_TABLE,
        KeyConditionExpression: 'PK = :pollId',
        FilterExpression: '#status = :active',
        ExpressionAttributeNames: {
          '#status': 'Status',
        },
        ExpressionAttributeValues: {
          ':pollId': pollId,
          ':active': 'Active',
        },
      })
    );

    const activeInstance = instancesResult.Items?.[0];

    // Get all instances (for history)
    const allInstancesResult = await docClient.send(
      new QueryCommand({
        TableName: process.env.POLL_INSTANCES_TABLE,
        KeyConditionExpression: 'PK = :pollId',
        ExpressionAttributeValues: {
          ':pollId': pollId,
        },
        ScanIndexForward: false, // Most recent first
      })
    );

    const allInstances = (allInstancesResult.Items || []).map(instance => ({
      instanceId: instance.SK,
      status: instance.Status,
      startDate: instance.StartDate,
      endDate: instance.EndDate,
      closedAt: instance.ClosedAt,
      options: instance.OptionsSnapshot,
      createdAt: instance.CreatedAt,
    }));

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        poll: {
          id: pollResult.Item.PK,
          title: pollResult.Item.Title,
          description: pollResult.Item.Description,
          isRecurring: pollResult.Item.IsRecurring,
          recurrenceType: pollResult.Item.RecurrenceType,
          durationDays: pollResult.Item.DurationDays,
          startDate: pollResult.Item.StartDate,
          endDate: pollResult.Item.EndDate,
          allowSuggestions: pollResult.Item.AllowSuggestions,
          createdAt: pollResult.Item.CreatedAt,
        },
        activeInstance: activeInstance ? {
          instanceId: activeInstance.SK,
          status: activeInstance.Status,
          startDate: activeInstance.StartDate,
          endDate: activeInstance.EndDate,
          options: activeInstance.OptionsSnapshot,
          createdAt: activeInstance.CreatedAt,
        } : null,
        allInstances,
      }),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to fetch poll details',
        details: error.message 
      }),
    };
  }
};

