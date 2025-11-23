import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.AWS_API_URL;
const API_KEY = process.env.AWS_API_KEY;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const { pollId } = await params;

    if (!API_URL) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(`${API_URL}/poll/${pollId}`, {
      headers: {
        'X-Api-Key': API_KEY || '',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch poll' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching poll:', error);
    return NextResponse.json(
      { error: 'Failed to fetch poll', details: error.message },
      { status: 500 }
    );
  }
}

