import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface PollOption {
  id: string;
  text: string;
}

interface CreatePollRequest {
  title: string;
  description?: string;
  options: PollOption[];
  isRecurring: boolean;
  recurrenceType?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM';
  durationDays?: number; // Duration in days (default: 7 for weekly)
  startDate?: string; // ISO date string (default: now)
  endDate?: string; // ISO date string (optional: when to stop recurring)
  allowSuggestions: boolean;
}

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const body: CreatePollRequest = JSON.parse(event.body || '{}');

    // Validation
    if (!body.title || !body.options || body.options.length < 2) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Title and at least 2 options are required' 
        }),
      };
    }

    const pollId = randomUUID();
    const now = new Date().toISOString();

    // Calculate duration based on recurrence type
    const recurrenceType = body.recurrenceType || 'WEEKLY';
    let durationDays = body.durationDays;
    
    if (!durationDays) {
      // Default durations based on type
      switch (recurrenceType) {
        case 'WEEKLY':
          durationDays = 7;
          break;
        case 'BIWEEKLY':
          durationDays = 14;
          break;
        case 'MONTHLY':
          durationDays = 30;
          break;
        default:
          durationDays = 7;
      }
    }

    const startDate = body.startDate || now;

    // Create Poll
    const poll = {
      PK: pollId,
      Title: body.title,
      Description: body.description || '',
      IsRecurring: body.isRecurring,
      RecurrenceType: recurrenceType,
      DurationDays: durationDays,
      StartDate: startDate,
      EndDate: body.endDate || null,
      AllowSuggestions: body.allowSuggestions,
      CreatedAt: now,
      UpdatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.POLLS_TABLE,
        Item: poll,
      })
    );

    // Create initial instance
    const instanceId = randomUUID();
    const instanceStartDate = new Date(startDate);
    const instanceEndDate = new Date(instanceStartDate);
    instanceEndDate.setDate(instanceEndDate.getDate() + durationDays);

    // Check if poll should start now or be scheduled
    const shouldStartNow = new Date(startDate) <= new Date();
    
    const pollInstance = {
      PK: pollId,
      SK: instanceId,
      Status: shouldStartNow ? 'Active' : 'Scheduled',
      StartDate: instanceStartDate.toISOString(),
      EndDate: instanceEndDate.toISOString(),
      OptionsSnapshot: body.options.map((opt) => ({
        id: opt.id || randomUUID(),
        text: opt.text,
        votes: 0,
      })),
      CreatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.POLL_INSTANCES_TABLE,
        Item: pollInstance,
      })
    );

    return {
      statusCode: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        pollId,
        instanceId,
        status: shouldStartNow ? 'active' : 'scheduled',
        startDate: instanceStartDate.toISOString(),
        endDate: instanceEndDate.toISOString(),
        message: shouldStartNow 
          ? 'Poll created and active' 
          : `Poll scheduled to start on ${instanceStartDate.toISOString()}`,
      }),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to create poll',
        details: error.message 
      }),
    };
  }
};

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

