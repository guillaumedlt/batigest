import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { signToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { checkRateLimit } from '@/lib/auth/rate-limit';

// POST /api/auth/login — Se connecter
export async function POST(request: NextRequest) {
  try {
    // Rate limiting par IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      const res = NextResponse.json(
        { error: 'Trop de tentatives de connexion. Veuillez reessayer dans quelques minutes.' },
        { status: 429 },
      );
      res.headers.set('Retry-After', String(rateCheck.retryAfter));
      return res;
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe obligatoires.' },
        { status: 400 },
      );
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect.' },
        { status: 401 },
      );
    }

    // Verifier le mot de passe
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect.' },
        { status: 401 },
      );
    }

    // Generer le JWT
    const token = await signToken(user.id, user.email);

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json({ error: 'Erreur de connexion.' }, { status: 500 });
  }
}
