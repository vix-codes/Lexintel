import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type VerificationRequestRow = {
  id: string;
  userId: string;
  documentType: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  draftContent: string;
  formInputs: unknown;
  lawyerComments: unknown;
  lawyerNotification: string;
  type: 'document' | 'lawyer';
};

type RawComment = {
  text?: unknown;
  timestamp?: unknown;
};

function toTimestamp(date: Date) {
  const seconds = Math.floor(date.getTime() / 1000);
  return { seconds, nanoseconds: 0 };
}

function normalizeCommentTimestamp(value: unknown) {
  if (value && typeof value === 'object' && 'seconds' in value) {
    const seconds = Number((value as { seconds: unknown }).seconds);
    return { seconds: Number.isFinite(seconds) ? seconds : 0, nanoseconds: 0 };
  }

  const asDate = value instanceof Date ? value : new Date(String(value ?? ''));
  if (Number.isNaN(asDate.getTime())) {
    return { seconds: 0, nanoseconds: 0 };
  }
  return toTimestamp(asDate);
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.email !== 'lawyer@lexintel.com') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const requests = await prisma.verificationRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const mapped = requests.map((r: VerificationRequestRow) => ({
      id: r.id,
      userId: r.userId,
      documentType: r.documentType,
      status: r.status,
      createdAt: toTimestamp(r.createdAt),
      updatedAt: toTimestamp(r.updatedAt),
      draftContent: r.draftContent,
      formInputs: (r.formInputs as any) ?? {},
      lawyerComments: Array.isArray(r.lawyerComments)
        ? (r.lawyerComments as RawComment[]).map((c: RawComment) => ({
            text: typeof c.text === 'string' ? c.text : '',
            timestamp: normalizeCommentTimestamp(c.timestamp),
          }))
        : [],
      lawyerNotification: r.lawyerNotification,
      type: r.type,
    }));

    return NextResponse.json({ requests: mapped }, { status: 200 });
  } catch (error) {
    console.error('Admin fetch verification requests error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch verification requests.' },
      { status: 500 },
    );
  }
}

