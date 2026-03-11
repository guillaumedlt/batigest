import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { getAuthUserId } from '@/lib/auth/get-user';

// GET /api/devis/:id — Detail d'un devis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
  }

  const { id } = await params;

  const devis = await prisma.devis.findFirst({
    where: { id, userId: userId, deletedAt: null },
    include: {
      contact: true,
      chantier: { select: { id: true, nom: true } },
      lignes: { orderBy: { ordre: 'asc' } },
      factures: {
        where: { deletedAt: null },
        select: { id: true, numero: true, type: true, statut: true, totalTTC: true, dateEmission: true },
        orderBy: { dateEmission: 'desc' },
      },
    },
  });

  if (!devis) {
    return NextResponse.json({ error: 'Devis non trouve.' }, { status: 404 });
  }

  return NextResponse.json(devis);
}

// PATCH /api/devis/:id — Modifier un devis
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

  const existing = await prisma.devis.findFirst({
    where: { id, userId: userId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Devis non trouve.' }, { status: 404 });
  }

  // Si les lignes sont fournies, recalculer les totaux
  if (body.lignes) {
    let totalHT = new Prisma.Decimal(0);
    let totalTVA = new Prisma.Decimal(0);

    const lignesData = body.lignes.map((ligne: {
      designation: string;
      description?: string;
      quantite: number;
      unite: string;
      prixUnitaireHT: number;
      tauxTVA: number;
      lot?: string;
    }, index: number) => {
      const qte = new Prisma.Decimal(ligne.quantite);
      const prix = new Prisma.Decimal(ligne.prixUnitaireHT);
      const ligneHT = qte.mul(prix);
      const taux = new Prisma.Decimal(ligne.tauxTVA);
      const ligneTVA = ligneHT.mul(taux).div(100);

      totalHT = totalHT.add(ligneHT);
      totalTVA = totalTVA.add(ligneTVA);

      return {
        designation: ligne.designation,
        description: ligne.description || null,
        quantite: qte,
        unite: ligne.unite,
        prixUnitaireHT: prix,
        tauxTVA: taux,
        totalHT: ligneHT,
        lot: ligne.lot || null,
        ordre: index + 1,
      };
    });

    const remise = body.remise !== undefined
      ? (body.remise ? new Prisma.Decimal(body.remise) : null)
      : (existing.remise);

    if (remise) {
      const originalHT = totalHT;
      totalHT = totalHT.sub(remise);
      const ratio = totalHT.div(originalHT);
      totalTVA = totalTVA.mul(ratio);
    }

    const totalTTC = totalHT.add(totalTVA);

    // Supprimer les anciennes lignes et recreer
    await prisma.devisLigne.deleteMany({ where: { devisId: id } });

    const devis = await prisma.devis.update({
      where: { id },
      data: {
        ...(body.objet !== undefined && { objet: body.objet }),
        ...(body.contactId !== undefined && { contactId: body.contactId }),
        ...(body.dateValidite !== undefined && { dateValidite: new Date(body.dateValidite) }),
        ...(body.conditions !== undefined && { conditions: body.conditions }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.statut !== undefined && { statut: body.statut }),
        remise,
        totalHT,
        totalTVA,
        totalTTC,
        lignes: {
          create: lignesData,
        },
      },
      include: {
        contact: true,
        lignes: { orderBy: { ordre: 'asc' } },
      },
    });

    return NextResponse.json(devis);
  }

  // Mise a jour sans lignes (statut, conditions, notes...)
  const devis = await prisma.devis.update({
    where: { id },
    data: {
      ...(body.objet !== undefined && { objet: body.objet }),
      ...(body.contactId !== undefined && { contactId: body.contactId }),
      ...(body.dateValidite !== undefined && { dateValidite: new Date(body.dateValidite) }),
      ...(body.conditions !== undefined && { conditions: body.conditions }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.statut !== undefined && { statut: body.statut }),
      ...(body.remise !== undefined && { remise: body.remise ? new Prisma.Decimal(body.remise) : null }),
    },
    include: {
      contact: true,
      lignes: { orderBy: { ordre: 'asc' } },
    },
  });

  return NextResponse.json(devis);
}

// DELETE /api/devis/:id — Supprimer un devis (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.devis.findFirst({
    where: { id, userId: userId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Devis non trouve.' }, { status: 404 });
  }

  await prisma.devis.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
