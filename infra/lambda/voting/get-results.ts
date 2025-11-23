import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const pollInstanceId = event.pathParameters?.pollInstanceId;

    if (!pollInstanceId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Poll instance ID is required' }),
      };
    }

    // Get all votes for this instance
    const votesResult = await docClient.send(
      new QueryCommand({
        TableName: process.env.VOTES_TABLE,
        KeyConditionExpression: 'PK = :instanceId',
        ExpressionAttributeValues: {
          ':instanceId': pollInstanceId,
        },
      })
    );

    const votes = votesResult.Items || [];

    // Get the poll instance to get option details
    const [pollId, instanceId] = pollInstanceId.split('#');
    const instanceResult = await docClient.send(
      new GetCommand({
        TableName: process.env.POLL_INSTANCES_TABLE,
        Key: {
          PK: pollId,
          SK: instanceId,
        },
      })
    );

    const options = instanceResult.Item?.OptionsSnapshot || [];

    // Aggregate results by option
    const voteCounts: Record<string, number> = {};
    votes.forEach((vote) => {
      voteCounts[vote.OptionID] = (voteCounts[vote.OptionID] || 0) + 1;
    });

    // Calculate total votes
    const totalVotes = votes.length;

    // Format results with option details and percentages
    const formattedResults = options.map((option: any) => ({
      optionId: option.id,
      optionText: option.text,
      votes: voteCounts[option.id] || 0,
      percentage: totalVotes > 0 ? ((voteCounts[option.id] || 0) / totalVotes) * 100 : 0,
    }));

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        instanceId: pollInstanceId,
        totalVotes,
        results: formattedResults,
        votes: votes.map((v) => ({
          optionId: v.OptionID,
          voterName: v.VoterName,
          timestamp: v.Timestamp,
        })),
      }),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to fetch results',
        details: error.message 
      }),
    };
  }
};

