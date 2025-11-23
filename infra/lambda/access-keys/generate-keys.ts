import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface GenerateKeysRequest {
  pollId: string;
  count: number;
  maxUses?: number;
  expiryDate?: string;
}

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const body: GenerateKeysRequest = JSON.parse(event.body || '{}');

    if (!body.pollId || !body.count || body.count < 1 || body.count > 1000) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Valid pollId and count (1-1000) are required' 
        }),
      };
    }

    const keys: any[] = [];
    const now = new Date().toISOString();

    // Generate keys
    for (let i = 0; i < body.count; i++) {
      const keyId = randomUUID();
      keys.push({
        PK: keyId,
        PollID: body.pollId,
        MaxUses: body.maxUses || 1,
        CurrentUses: 0,
        ExpiryDate: body.expiryDate 
          ? Math.floor(new Date(body.expiryDate).getTime() / 1000)
          : Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year default
        CreatedAt: now,
      });
    }

    // Batch write (DynamoDB allows max 25 items per batch)
    const batches = [];
    for (let i = 0; i < keys.length; i += 25) {
      batches.push(keys.slice(i, i + 25));
    }

    for (const batch of batches) {
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [process.env.ACCESS_KEYS_TABLE!]: batch.map((key) => ({
              PutRequest: { Item: key },
            })),
          },
        })
      );
    }

    return {
      statusCode: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: `${keys.length} access keys generated successfully`,
        keys: keys.map((k) => ({
          keyId: k.PK,
          maxUses: k.MaxUses,
          expiryDate: new Date(k.ExpiryDate * 1000).toISOString(),
        })),
      }),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to generate access keys',
        details: error.message 
      }),
    };
  }
};

