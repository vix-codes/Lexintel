import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id, draftContent } = await request.json();

    if (typeof id !== 'string' || typeof draftContent !== 'string' || !draftContent.trim()) {
      return NextResponse.json({ message: 'Invalid payload.' }, { status: 400 });
    }

    const existing = await prisma.verificationRequest.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ message: 'Not found.' }, { status: 404 });
    }

    await prisma.verificationRequest.update({
      where: { id },
      data: {
        draftContent,
        status: 'pending',
        lawyerComments: [],
        lawyerNotification: '',
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Resubmit verification request error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to resubmit verification request.' },
      { status: 500 },
    );
  }
}

