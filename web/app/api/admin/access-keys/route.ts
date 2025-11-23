import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.AWS_API_URL;

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

    const response = await fetch(`${API_URL}/admin/access-keys`, {
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
        { error: data.error || 'Failed to generate keys' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error generating keys:', error);
    return NextResponse.json(
      { error: 'Failed to generate keys', details: error.message },
      { status: 500 }
    );
  }
}

