
'use server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const LAWYER_EMAIL = 'lawyer@lexintel.com';

async function requireLawyer() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  if (user.role !== 'LAWYER' && user.email !== LAWYER_EMAIL) {
    throw new Error('Forbidden');
  }
}

export const addLawyerComment = async (
  requestId: string,
  commentText: string
): Promise<{ success: boolean; error?: string }> => {
  if (!requestId || !commentText) {
    return { success: false, error: 'Request ID and comment are required.' };
  }

  try {
    await requireLawyer();

    const newComment = {
      text: commentText,
      timestamp: new Date()
    };

    const existing = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      select: { lawyerComments: true },
    });

    const currentComments = (existing?.lawyerComments as LawyerComment[] | null) ?? [];

    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: 'reviewed',
        lawyerComments: [...currentComments, newComment],
        lawyerNotification: 'Your draft has been reviewed.',
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error adding lawyer comment:', error);
    return { success: false, error: error.message || 'Failed to add comment.' };
  }
};


interface ApproveRequestData {
  userId: string;
  type: 'document' | 'lawyer';
  documentType: string;
  draftContent: string;
  formInputs: Record<string, unknown>;
}

export const approveRequest = async (
  requestId: string,
  requestData: ApproveRequestData
): Promise<{ success: boolean; error?: string }> => {
  if (!requestId || !requestData) {
    return { success: false, error: 'Request ID and data are required.' };
  }
  try {
    await requireLawyer();

    if (requestData.type === 'lawyer' && requestData.userId && requestData.formInputs) {
      const profileData = requestData.formInputs as {
        email?: string;
        name?: string;
        phone?: string;
        enrollmentNumber?: string;
        location?: { city?: string; state?: string };
        specializations?: string[];
        experience?: number;
        description?: string;
      };
      await prisma.lawyerProfile.upsert({
        where: { userId: requestData.userId },
        create: {
          userId: requestData.userId,
          email: profileData.email ?? '',
          name: profileData.name ?? '',
          phone: profileData.phone,
          enrollmentNumber: profileData.enrollmentNumber,
          locationCity: profileData.location?.city ?? 'Unknown',
          locationState: profileData.location?.state ?? 'Unknown',
          specializations: Array.isArray(profileData.specializations)
            ? profileData.specializations
            : [],
          experienceYears: profileData.experience,
          description: profileData.description,
          isVerified: true,
          rating: 4.5,
          source: 'internal',
        },
        update: {
          email: profileData.email ?? '',
          name: profileData.name ?? '',
          phone: profileData.phone,
          enrollmentNumber: profileData.enrollmentNumber,
          locationCity: profileData.location?.city ?? 'Unknown',
          locationState: profileData.location?.state ?? 'Unknown',
          specializations: Array.isArray(profileData.specializations)
            ? profileData.specializations
            : [],
          experienceYears: profileData.experience,
          description: profileData.description,
          isVerified: true,
          rating: 4.5,
          source: 'internal',
        },
      });
    } else if (requestData.type === 'document' && requestData.userId) {
      await prisma.approvedDraft.create({
        data: {
          userId: requestData.userId,
          originalRequestId: requestId,
          documentType: requestData.documentType,
          approvedContent: requestData.draftContent,
        },
      });
    }

    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        lawyerNotification: `Your ${requestData.type ?? 'draft'} has been approved.`,
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error approving request:', error);
    return { success: false, error: error.message || 'Failed to approve request.' };
  }
};


export const rejectRequest = async (
  requestId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> => {
  if (!requestId) {
    return { success: false, error: 'Request ID is required.' };
  }
  
  const finalReason = reason.trim() || 'Your profile verification has been rejected due to incomplete or invalid information.';

  try {
    await requireLawyer();

    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        lawyerNotification: finalReason,
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting request:', error);
    return { success: false, error: error.message || 'Failed to reject request.' };
  }
};


export const getUserRequests = async (userId: string): Promise<SerializedVerificationRequest[]> => {
  if (!userId) return [];
  try {
    const requests = await prisma.verificationRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return requests.map((r: VerificationRequestRow) => ({
      id: r.id,
      userId: r.userId,
      documentType: r.documentType,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      draftContent: r.draftContent,
      formInputs: r.formInputs,
      lawyerComments: r.lawyerComments || [],
      lawyerNotification: r.lawyerNotification,
      type: r.type,
    }));
  } catch (err) {
    console.error('Error fetching user requests:', err);
    return [];
  }
};

export const getUserProfiles = async (userIds: string[]): Promise<Record<string, string>> => {
  const profiles: Record<string, string> = {};
  if (!userIds || userIds.length === 0) {
    return profiles;
  }
  try {
    await requireLawyer();

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });

    users.forEach((u: { id: string; username: string | null }) => {
      profiles[u.id] = u.username || 'Unknown User';
    });
    return profiles;
  } catch (err) {
    console.error('Error fetching user profiles:', err);
    return profiles;
  }
};
type LawyerComment = {
  text: string;
  timestamp: Date;
};

type SerializedVerificationRequest = {
  id: string;
  userId: string;
  documentType: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  draftContent: string;
  formInputs: unknown;
  lawyerComments: unknown;
  lawyerNotification: string;
  type: 'document' | 'lawyer';
};

type VerificationRequestRow = {
  id: string;
  userId: string;
  documentType: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  draftContent: string;
  formInputs: unknown;
  lawyerComments: unknown | null;
  lawyerNotification: string;
  type: 'document' | 'lawyer';
};
