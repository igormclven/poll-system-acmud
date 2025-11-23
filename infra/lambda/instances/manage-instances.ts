import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const action = event.requestContext?.http?.method;
    const body = event.body ? JSON.parse(event.body) : {};
    
    const { pollId, instanceId, operation } = body;

    if (!pollId || !instanceId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Poll ID and Instance ID are required' }),
      };
    }

    switch (operation) {
      case 'close':
        return await closeInstance(pollId, instanceId);
      case 'reopen':
        return await reopenInstance(pollId, instanceId);
      case 'delete':
        return await deleteInstance(pollId, instanceId);
      default:
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid operation. Use: close, reopen, or delete' }),
        };
    }
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to manage instance',
        details: error.message 
      }),
    };
  }
};

async function closeInstance(pollId: string, instanceId: string) {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: process.env.POLL_INSTANCES_TABLE,
        Key: {
          PK: pollId,
          SK: instanceId,
        },
        UpdateExpression: 'SET #status = :closed, ClosedAt = :now',
        ExpressionAttributeNames: {
          '#status': 'Status',
        },
        ExpressionAttributeValues: {
          ':closed': 'Closed',
          ':now': new Date().toISOString(),
        },
      })
    );

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Instance closed successfully',
        instanceId,
      }),
    };
  } catch (error: any) {
    throw new Error(`Failed to close instance: ${error.message}`);
  }
}

async function reopenInstance(pollId: string, instanceId: string) {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: process.env.POLL_INSTANCES_TABLE,
        Key: {
          PK: pollId,
          SK: instanceId,
        },
        UpdateExpression: 'SET #status = :active REMOVE ClosedAt',
        ExpressionAttributeNames: {
          '#status': 'Status',
        },
        ExpressionAttributeValues: {
          ':active': 'Active',
        },
      })
    );

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Instance reopened successfully',
        instanceId,
      }),
    };
  } catch (error: any) {
    throw new Error(`Failed to reopen instance: ${error.message}`);
  }
}

async function deleteInstance(pollId: string, instanceId: string) {
  try {
    // First, get all votes for this instance to delete them
    const votesResult = await docClient.send(
      new QueryCommand({
        TableName: process.env.VOTES_TABLE,
        KeyConditionExpression: 'PK = :instanceId',
        ExpressionAttributeValues: {
          ':instanceId': `${pollId}#${instanceId}`,
        },
      })
    );

    // Delete all votes
    const deleteVotePromises = (votesResult.Items || []).map((vote) =>
      docClient.send(
        new DeleteCommand({
          TableName: process.env.VOTES_TABLE,
          Key: {
            PK: vote.PK,
            SK: vote.SK,
          },
        })
      )
    );

    await Promise.all(deleteVotePromises);

    // Delete the instance itself
    await docClient.send(
      new DeleteCommand({
        TableName: process.env.POLL_INSTANCES_TABLE,
        Key: {
          PK: pollId,
          SK: instanceId,
        },
      })
    );

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Instance and associated votes deleted successfully',
        instanceId,
        votesDeleted: votesResult.Items?.length || 0,
      }),
    };
  } catch (error: any) {
    throw new Error(`Failed to delete instance: ${error.message}`);
  }
}

