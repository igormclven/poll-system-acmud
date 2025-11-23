import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const method = event.requestContext?.http?.method;

    // GET: List suggestions
    if (method === 'GET') {
      const pollId = event.queryStringParameters?.pollId;
      const status = event.queryStringParameters?.status;

      if (!pollId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'pollId is required' }),
        };
      }

      const params: any = {
        TableName: process.env.SUGGESTIONS_TABLE,
        KeyConditionExpression: 'PK = :pollId',
        ExpressionAttributeValues: {
          ':pollId': pollId,
        },
      };

      if (status) {
        params.FilterExpression = '#status = :status';
        params.ExpressionAttributeNames = { '#status': 'Status' };
        params.ExpressionAttributeValues[':status'] = status;
      }

      const result = await docClient.send(new QueryCommand(params));

      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          suggestions: result.Items?.map((item) => ({
            id: item.SK,
            pollId: item.PK,
            text: item.Text,
            status: item.Status,
            targetWeek: item.TargetWeek,
            createdAt: item.CreatedAt,
          })) || [],
        }),
      };
    }

    // PUT: Update suggestion status
    if (method === 'PUT') {
      const body = JSON.parse(event.body || '{}');

      if (!body.pollId || !body.suggestionId || !body.status) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'pollId, suggestionId, and status are required' 
          }),
        };
      }

      await docClient.send(
        new UpdateCommand({
          TableName: process.env.SUGGESTIONS_TABLE,
          Key: {
            PK: body.pollId,
            SK: body.suggestionId,
          },
          UpdateExpression: 'SET #status = :status, UpdatedAt = :now',
          ExpressionAttributeNames: {
            '#status': 'Status',
          },
          ExpressionAttributeValues: {
            ':status': body.status,
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
          message: 'Suggestion updated successfully',
        }),
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to manage suggestions',
        details: error.message 
      }),
    };
  }
};

