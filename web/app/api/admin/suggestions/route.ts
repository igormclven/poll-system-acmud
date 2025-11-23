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

    const pollId = req.nextUrl.searchParams.get('pollId');
    const status = req.nextUrl.searchParams.get('status');

    const params = new URLSearchParams();
    if (pollId) params.append('pollId', pollId);
    if (status) params.append('status', status);

    const response = await fetch(
      `${API_URL}/admin/suggestions?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch suggestions' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!API_URL) {
      throw new Error('API URL not configured');
    }

    const body = await req.json();

    const response = await fetch(`${API_URL}/admin/suggestions`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to update suggestion' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error updating suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to update suggestion', details: error.message },
      { status: 500 }
    );
  }
}

