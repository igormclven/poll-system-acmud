import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.AWS_API_URL;
const API_KEY = process.env.AWS_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!API_URL) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(`${API_URL}/vote`, {
      method: 'POST',
      headers: {
        'X-Api-Key': API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to submit vote' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error submitting vote:', error);
    return NextResponse.json(
      { error: 'Failed to submit vote', details: error.message },
      { status: 500 }
    );
  }
}

