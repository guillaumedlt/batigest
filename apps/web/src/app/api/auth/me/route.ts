import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth/get-user';
import { prisma } from '@/lib/db/prisma';

// GET /api/auth/me — Utilisateur connecte
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      entreprise: {
        select: { id: true, nomEntreprise: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
