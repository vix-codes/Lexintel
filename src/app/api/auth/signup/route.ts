import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSession, hashPassword, SESSION_COOKIE_NAME } from '@/lib/auth';

const LAWYER_EMAIL = 'lawyer@lexintel.com';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ message: 'Invalid payload.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'This email is already in use. Please log in.' },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const username = normalizedEmail.split('@')[0];

    const role = normalizedEmail === LAWYER_EMAIL ? 'LAWYER' : 'USER';

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        username,
        role,
      },
    });

    const { sessionToken, expiresAt } = await createSession(user.id);

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      },
      { status: 201 },
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred during signup.' },
      { status: 500 },
    );
  }
}

