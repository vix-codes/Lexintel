
'use server';

import { generateLegalDraft } from '@/ai/flows/generate-legal-draft';
import { answerLegalQuery, type LegalQueryOutput } from '@/ai/flows/answer-legal-query';
import { documentTemplates } from '@/lib/data';
import { prisma } from '@/lib/db';


/* ----------------------------
   GENERATE DRAFT
-----------------------------*/

type DraftState = {
  draft?: string;
  error?: string;
};

export const generateDraft = async (
  prevState: DraftState,
  formData: FormData
): Promise<DraftState> => {
  const docType = formData.get('documentType') as string;
  const rawData = Object.fromEntries(formData.entries());
  const userId = formData.get('userId') as string;

  try {
    const result = await generateLegalDraft({
      documentType: docType,
      formData: rawData
    });

    const draftContent = result.legalDraft;

    if (userId) {
      const subject =
        documentTemplates.find((t) => t.value === docType)?.label ?? 'document';
      await prisma.activity.create({
        data: {
          userId,
          action: 'Generated',
          subject,
          metadata: {
            documentType: docType,
          },
        },
      });
    }

    return { draft: draftContent };
  } catch (error: any) {
    console.error("Error generating draft:", error);
    return { error: "Could not generate draft. Try again." };
  }
};


/* ----------------------------
   LAW BOT
-----------------------------*/

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export const askLawbot = async (
  query: string,
  history: Message[]
): Promise<LegalQueryOutput> => {
  if (!query) return { answer: "Please provide a query." };

  try {
    return await answerLegalQuery({ query, history });
  } catch (error: any) {
    console.error("LawBot Error:", error);
    return { answer: "I'm having trouble answering. Try again soon." };
  }
};


/* ----------------------------
   REQUEST VERIFICATION
-----------------------------*/

export async function requestVerification(
  userId: string,
  documentType: string,
  draftContent: string,
  formInputs: Record<string, any>
) {
  if (!userId || !draftContent) {
    return { success: false, error: "Missing data." };
  }

  try {
    await prisma.verificationRequest.create({
      data: {
        userId,
        type: 'document',
        documentType,
        draftContent,
        formInputs,
        status: 'pending',
        lawyerComments: [],
        lawyerNotification: '',
      },
    });

    return { success: true };
  } catch (error) {
    console.error("SERVER VERIFICATION ERROR:", error);
    return { success: false, error: "Failed to save verification request on server." };
  }
}


/* ----------------------------
   REQUEST LAWYER VERIFICATION
-----------------------------*/

export async function requestLawyerVerification(
  userId: string,
  profileData: Record<string, any>
) {
  if (!userId) return { success: false, error: "Missing user ID." };

  try {
    await prisma.verificationRequest.create({
      data: {
        userId,
        type: 'lawyer',
        documentType: 'Lawyer Profile',
        draftContent: `
Verification request for ${profileData.name}.
Email: ${profileData.email}
Phone: ${profileData.phone}
Enrollment ID: ${profileData.enrollmentNumber}
Location: ${profileData.location?.city}, ${profileData.location?.state}
Specializations: ${Array.isArray(profileData.specializations) ? profileData.specializations.join(", ") : ""}
Experience: ${profileData.experience} years
Bio: ${profileData.description}
        `.trim(),
        formInputs: profileData,
        status: 'pending',
        lawyerComments: [],
        lawyerNotification: '',
      },
    });

    return { success: true };
  } catch (error) {
    console.error("LAWYER VERIFICATION ERROR:", error);
    return { success: false, error: "Failed to submit lawyer profile for verification." };
  }
}
