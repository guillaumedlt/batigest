import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/achats/:id — Detail d'une fiche d'achat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const achat = await prisma.ficheAchat.findFirst({
      where: { id, userId: TEMP_USER_ID, deletedAt: null },
      include: {
        fournisseur: { select: { id: true, nom: true, prenom: true, entreprise: true, telephone: true } },
        chantier: { select: { id: true, nom: true } },
      },
    });

    if (!achat) {
      return NextResponse.json({ error: 'Fiche d\'achat non trouvee.' }, { status: 404 });
    }

    return NextResponse.json(achat);
  } catch (error) {
    console.error('GET /api/achats/[id] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/achats/:id — Modifier une fiche d'achat
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.ficheAchat.findFirst({
      where: { id, userId: TEMP_USER_ID, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Fiche d\'achat non trouvee.' }, { status: 404 });
    }

    const montantHT = body.montantHT !== undefined ? new Prisma.Decimal(body.montantHT) : existing.montantHT;
    const tauxTVA = body.tauxTVA !== undefined ? new Prisma.Decimal(body.tauxTVA) : existing.tauxTVA;
    const montantTTC = montantHT.add(montantHT.mul(tauxTVA).div(100));

    const achat = await prisma.ficheAchat.update({
      where: { id },
      data: {
        ...(body.designation !== undefined ? { designation: body.designation } : {}),
        ...(body.date !== undefined ? { date: new Date(body.date) } : {}),
        ...(body.categorie !== undefined ? { categorie: body.categorie } : {}),
        montantHT,
        tauxTVA,
        montantTTC,
        ...(body.fournisseurId !== undefined ? { fournisseurId: body.fournisseurId || null } : {}),
        ...(body.photoUrl !== undefined ? { photoUrl: body.photoUrl || null } : {}),
        ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
        ...(body.chantierId !== undefined ? { chantierId: body.chantierId || null } : {}),
      },
      include: {
        fournisseur: { select: { id: true, nom: true, prenom: true, entreprise: true } },
      },
    });

    return NextResponse.json(achat);
  } catch (error) {
    console.error('PATCH /api/achats/[id] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/achats/:id — Supprimer une fiche d'achat (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await prisma.ficheAchat.findFirst({
      where: { id, userId: TEMP_USER_ID, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Fiche d\'achat non trouvee.' }, { status: 404 });
    }

    await prisma.ficheAchat.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/achats/[id] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
