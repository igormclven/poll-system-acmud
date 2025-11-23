import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.AWS_API_URL;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!API_URL) {
      throw new Error('API URL not configured');
    }

    const response = await fetch(`${API_URL}/admin/polls`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch polls' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching polls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch polls', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!API_URL) {
      throw new Error('API URL not configured');
    }

    const body = await req.json();

    const response = await fetch(`${API_URL}/admin/polls`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to create poll' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error creating poll:', error);
    return NextResponse.json(
      { error: 'Failed to create poll', details: error.message },
      { status: 500 }
    );
  }
}

