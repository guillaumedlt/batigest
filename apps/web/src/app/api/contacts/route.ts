import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// TODO: Remplacer par l'ID utilisateur reel via Supabase Auth
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/contacts — Liste des contacts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || undefined;

  const contacts = await prisma.contact.findMany({
    where: {
      userId: TEMP_USER_ID,
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
}

// POST /api/contacts — Creer un contact
export async function POST(request: NextRequest) {
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
      userId: TEMP_USER_ID,
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
