import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { signToken, COOKIE_NAME } from '@/lib/auth/jwt';

// POST /api/auth/signup — Creer un compte
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nomEntreprise, telephone } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe obligatoires.' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit faire au moins 6 caracteres.' },
        { status: 400 },
      );
    }

    // Verifier si l'email existe deja
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Un compte existe deja avec cet email.' },
        { status: 409 },
      );
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Creer l'utilisateur + entreprise en une transaction
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        entreprise: {
          create: {
            nomEntreprise: nomEntreprise || 'Mon entreprise',
            adresse: '',
            codePostal: '',
            ville: '',
            telephone: telephone || '',
            email: email.toLowerCase().trim(),
          },
        },
      },
      include: { entreprise: true },
    });

    // Generer le JWT
    const token = await signToken(user.id, user.email);

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      entreprise: user.entreprise,
    }, { status: 201 });

    // Cookie HTTP-only securise
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 jours
    });

    return response;
  } catch (error) {
    console.error('POST /api/auth/signup error:', error);
    return NextResponse.json({ error: 'Erreur lors de la creation du compte.' }, { status: 500 });
  }
}
