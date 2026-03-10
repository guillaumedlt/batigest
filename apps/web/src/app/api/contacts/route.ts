import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUserId } from '@/lib/auth/get-user';

// GET /api/contacts — Liste des contacts
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || undefined;

    const contacts = await prisma.contact.findMany({
      where: {
        userId: userId,
        deletedAt: null,
        ...(type ? { type: type as 'CLIENT' | 'PROSPECT' | 'FOURNISSEUR' | 'SOUS_TRAITANT' } : {}),
        ...(search
          ? {
              OR: [
                { nom: { contains: search, mode: 'insensitive' } },
                { prenom: { contains: search, mode: 'insensitive' } },
                { entreprise: { contains: search, mode: 'insensitive' } },
                { telephone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { nom: 'asc' },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('GET /api/contacts error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/contacts — Creer un contact
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
  }

  const body = await request.json();

  // Validation basique
  if (!body.nom || !body.telephone || !body.type) {
    return NextResponse.json(
      { error: 'Le nom, le telephone et le type sont obligatoires.' },
      { status: 400 },
    );
  }

  const validTypes = ['CLIENT', 'PROSPECT', 'FOURNISSEUR', 'SOUS_TRAITANT'];
  if (!validTypes.includes(body.type)) {
    return NextResponse.json(
      { error: 'Type invalide. Utilisez : CLIENT, PROSPECT, FOURNISSEUR ou SOUS_TRAITANT.' },
      { status: 400 },
    );
  }

  const contact = await prisma.contact.create({
    data: {
      userId: userId,
      type: body.type,
      nom: body.nom,
      prenom: body.prenom || null,
      entreprise: body.entreprise || null,
      telephone: body.telephone,
      email: body.email || null,
      adresse: body.adresse || null,
      codePostal: body.codePostal || null,
      ville: body.ville || null,
      siret: body.siret || null,
      notes: body.notes || null,
      tags: body.tags || [],
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
