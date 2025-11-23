import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface VoteRequest {
  keyId: string;
  pollId: string;
  optionId: string;
  voterName?: string;
}

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const body: VoteRequest = JSON.parse(event.body || '{}');

    if (!body.keyId || !body.pollId || !body.optionId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'keyId, pollId, and optionId are required' 
        }),
      };
    }

    // 1. Validate access key
    const keyResult = await docClient.send(
      new GetCommand({
        TableName: process.env.ACCESS_KEYS_TABLE,
        Key: { PK: body.keyId },
      })
    );

    if (!keyResult.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid access key' }),
      };
    }

    const accessKey = keyResult.Item;

    // Check if key is for the correct poll
    if (accessKey.PollID !== body.pollId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access key not valid for this poll' }),
      };
    }

    // Check if key has expired
    const now = Math.floor(Date.now() / 1000);
    if (accessKey.ExpiryDate && accessKey.ExpiryDate < now) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access key has expired' }),
      };
    }

    // Check if key has uses remaining
    if (accessKey.CurrentUses >= accessKey.MaxUses) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access key has no remaining uses' }),
      };
    }

    // 2. Get active poll instance
    const instancesResult = await docClient.send(
      new QueryCommand({
        TableName: process.env.POLL_INSTANCES_TABLE,
        KeyConditionExpression: 'PK = :pollId',
        FilterExpression: '#status = :active',
        ExpressionAttributeNames: {
          '#status': 'Status',
        },
        ExpressionAttributeValues: {
          ':pollId': body.pollId,
          ':active': 'Active',
        },
      })
    );

    const activeInstance = instancesResult.Items?.[0];

    if (!activeInstance) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No active poll instance found' }),
      };
    }

    // 3. Check if user already voted in this instance (prevent double voting)
    const existingVoteResult = await docClient.send(
      new GetCommand({
        TableName: process.env.VOTES_TABLE,
        Key: { 
          PK: activeInstance.SK, // PollInstanceID
          SK: body.keyId,
        },
      })
    );

    if (existingVoteResult.Item) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'You have already voted in this poll instance' 
        }),
      };
    }

    // 4. Validate optionId exists in the instance
    const optionExists = activeInstance.OptionsSnapshot.some(
      (opt: any) => opt.id === body.optionId
    );

    if (!optionExists) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid option ID' }),
      };
    }

    // 5. Execute transaction: Update access key usage + Record vote
    const timestamp = new Date().toISOString();

    // Update access key usage
    await docClient.send(
      new UpdateCommand({
        TableName: process.env.ACCESS_KEYS_TABLE,
        Key: { PK: body.keyId },
        UpdateExpression: 'SET CurrentUses = CurrentUses + :inc, UpdatedAt = :now',
        ExpressionAttributeValues: {
          ':inc': 1,
          ':now': timestamp,
        },
      })
    );

    // Record vote
    await docClient.send(
      new PutCommand({
        TableName: process.env.VOTES_TABLE,
        Item: {
          PK: activeInstance.SK, // PollInstanceID
          SK: body.keyId, // Using keyId as SK prevents double voting
          OptionID: body.optionId,
          VoterName: body.voterName || null,
          Timestamp: timestamp,
        },
      })
    );

    return {
      statusCode: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Vote recorded successfully',
        remainingUses: accessKey.MaxUses - (accessKey.CurrentUses + 1),
      }),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to record vote',
        details: error.message 
      }),
    };
  }
};

