import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch current user.' },
      { status: 500 },
    );
  }
}

