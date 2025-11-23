import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface SuggestionRequest {
  pollId: string;
  text: string;
  targetWeek?: 'current' | 'next';
}

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const body: SuggestionRequest = JSON.parse(event.body || '{}');

    if (!body.pollId || !body.text) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'pollId and text are required' 
        }),
      };
    }

    const suggestionId = randomUUID();
    const now = new Date().toISOString();

    const suggestion = {
      PK: body.pollId,
      SK: suggestionId,
      Text: body.text,
      Status: 'Pending',
      TargetWeek: body.targetWeek || 'next',
      CreatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.SUGGESTIONS_TABLE,
        Item: suggestion,
      })
    );

    return {
      statusCode: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Suggestion submitted successfully',
        suggestionId,
      }),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to submit suggestion',
        details: error.message 
      }),
    };
  }
};

