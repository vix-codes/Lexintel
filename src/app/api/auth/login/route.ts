import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSession, verifyPassword, SESSION_COOKIE_NAME } from '@/lib/auth';

const LAWYER_EMAIL = 'lawyer@lexintel.com';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ message: 'Invalid payload.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Incorrect email or password. Please try again.' },
        { status: 401 },
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { message: 'Incorrect email or password. Please try again.' },
        { status: 401 },
      );
    }

    const { sessionToken, expiresAt } = await createSession(user.id);

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isLawyer: normalizedEmail === LAWYER_EMAIL || user.role === 'LAWYER',
        },
      },
      { status: 200 },
    );

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred during login.' },
      { status: 500 },
    );
  }
}

