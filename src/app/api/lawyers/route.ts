import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const profiles = await prisma.lawyerProfile.findMany();

    const lawyers = profiles.map((p) => ({
      id: p.userId,
      email: p.email,
      name: p.name,
      phone: p.phone,
      enrollmentNumber: p.enrollmentNumber,
      location: {
        city: p.locationCity,
        state: p.locationState,
      },
      specializations: p.specializations,
      experience: p.experienceYears ?? undefined,
      description: p.description,
      isVerified: p.isVerified,
      rating: p.rating ?? 4.5,
      source: p.source ?? 'internal',
    }));

    return NextResponse.json({ lawyers }, { status: 200 });
  } catch (error) {
    console.error('Fetch lawyers error:', error);
    return NextResponse.json(
      { lawyers: [] },
      { status: 500 },
    );
  }
}

