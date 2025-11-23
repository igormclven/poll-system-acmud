import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: process.env.POLLS_TABLE,
      })
    );

    const polls = result.Items || [];

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        polls: polls.map((poll) => ({
          id: poll.PK,
          title: poll.Title,
          description: poll.Description,
          isRecurring: poll.IsRecurring,
          frequency: poll.Frequency,
          allowSuggestions: poll.AllowSuggestions,
          createdAt: poll.CreatedAt,
        })),
      }),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to fetch polls',
        details: error.message 
      }),
    };
  }
};

