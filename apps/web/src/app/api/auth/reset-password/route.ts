import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { COOKIE_NAME } from '@/lib/auth/jwt';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'batigest-dev-secret-change-in-production-2026'
);

// POST /api/auth/reset-password — Reinitialiser le mot de passe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et mot de passe obligatoires.' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caracteres.' },
        { status: 400 },
      );
    }

    // Verifier le token JWT
    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload;
    } catch {
      return NextResponse.json(
        { error: 'Lien de reinitialisation invalide ou expire.' },
        { status: 400 },
      );
    }

    // Verifier que c'est bien un token de reinitialisation
    if (payload.purpose !== 'reset' || !payload.userId) {
      return NextResponse.json(
        { error: 'Token invalide.' },
        { status: 400 },
      );
    }

    const userId = payload.userId as string;

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouve.' },
        { status: 404 },
      );
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Mettre a jour le mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Supprimer la session existante
    const response = NextResponse.json({
      message: 'Mot de passe reinitialise avec succes.',
    });

    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('POST /api/auth/reset-password error:', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
