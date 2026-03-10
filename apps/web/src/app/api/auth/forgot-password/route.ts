import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'batigest-dev-secret-change-in-production-2026'
);

// POST /api/auth/forgot-password — Demande de reinitialisation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email obligatoire.' },
        { status: 400 },
      );
    }

    // Toujours retourner 200 pour ne pas reveler si l'email existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (user) {
      // Generer un JWT de reinitialisation (expire dans 1h)
      const resetToken = await new SignJWT({ userId: user.id, purpose: 'reset' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(JWT_SECRET);

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      // TODO: Integrer un service email (Resend, SendGrid, etc.) pour envoyer le lien
      console.log(`[DEV] Lien de reinitialisation pour ${user.email}:`);
      console.log(`[DEV] ${resetUrl}`);
    }

    return NextResponse.json({
      message: 'Si un compte existe avec cet email, vous recevrez un lien de reinitialisation.',
    });
  } catch (error) {
    console.error('POST /api/auth/forgot-password error:', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
