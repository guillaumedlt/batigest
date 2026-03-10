import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUserId } from '@/lib/auth/get-user';

// GET /api/contacts/:id — Detail d'un contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
  }

  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: { id, userId: userId, deletedAt: null },
    include: {
      devis: {
        where: { deletedAt: null },
        select: { id: true, numero: true, objet: true, statut: true, totalTTC: true, dateCreation: true },
        orderBy: { dateCreation: 'desc' },
        take: 10,
      },
      factures: {
        where: { deletedAt: null },
        select: { id: true, numero: true, type: true, statut: true, totalTTC: true, resteARegler: true, dateEmission: true },
        orderBy: { dateEmission: 'desc' },
        take: 10,
      },
      chantiers: {
        where: { deletedAt: null },
        select: { id: true, nom: true, statut: true, dateDebut: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!contact) {
    return NextResponse.json({ error: 'Contact non trouve.' }, { status: 404 });
  }

  return NextResponse.json(contact);
}

// PATCH /api/contacts/:id — Modifier un contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Verifier que le contact existe
  const existing = await prisma.contact.findFirst({
    where: { id, userId: userId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Contact non trouve.' }, { status: 404 });
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...(body.nom !== undefined && { nom: body.nom }),
      ...(body.prenom !== undefined && { prenom: body.prenom }),
      ...(body.entreprise !== undefined && { entreprise: body.entreprise }),
      ...(body.telephone !== undefined && { telephone: body.telephone }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.adresse !== undefined && { adresse: body.adresse }),
      ...(body.codePostal !== undefined && { codePostal: body.codePostal }),
      ...(body.ville !== undefined && { ville: body.ville }),
      ...(body.siret !== undefined && { siret: body.siret }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.tags !== undefined && { tags: body.tags }),
      ...(body.type !== undefined && { type: body.type }),
    },
  });

  return NextResponse.json(contact);
}

// DELETE /api/contacts/:id — Supprimer un contact (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.contact.findFirst({
    where: { id, userId: userId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Contact non trouve.' }, { status: 404 });
  }

  await prisma.contact.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
