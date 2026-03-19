import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { getAuthUserId } from '@/lib/auth/get-user';

// GET /api/factures/:id — Detail d'une facture
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
  }

  const { id } = await params;

  const facture = await prisma.facture.findFirst({
    where: { id, userId: userId, deletedAt: null },
    include: {
      contact: true,
      chantier: { select: { id: true, nom: true } },
      devis: { select: { id: true, numero: true, objet: true } },
      lignes: { orderBy: { ordre: 'asc' } },
      paiements: { orderBy: { date: 'desc' } },
      avoirs: {
        where: { deletedAt: null },
        select: { id: true, numero: true, totalTTC: true, dateEmission: true },
      },
    },
  });

  if (!facture) {
    return NextResponse.json({ error: 'Facture non trouvee.' }, { status: 404 });
  }

  return NextResponse.json(facture);
}

// PATCH /api/factures/:id — Modifier une facture
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

  const existing = await prisma.facture.findFirst({
    where: { id, userId: userId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Facture non trouvee.' }, { status: 404 });
  }

  // Mise a jour du statut uniquement
  if (body.statut && !body.lignes) {
    const facture = await prisma.facture.update({
      where: { id },
      data: { statut: body.statut },
      include: {
        contact: true,
        devis: { select: { id: true, numero: true, objet: true } },
        lignes: { orderBy: { ordre: 'asc' } },
        paiements: { orderBy: { date: 'desc' } },
      },
    });
    return NextResponse.json(facture);
  }

  // Mise a jour avec recalcul des lignes
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
      avancement?: number;
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
        avancement: ligne.avancement ? new Prisma.Decimal(ligne.avancement) : null,
        ordre: index + 1,
      };
    });

    const totalTTC = totalHT.add(totalTVA);
    const montantPaye = existing.montantPaye;
    const resteARegler = totalTTC.sub(montantPaye);

    await prisma.factureLigne.deleteMany({ where: { factureId: id } });

    const facture = await prisma.facture.update({
      where: { id },
      data: {
        ...(body.contactId !== undefined && { contactId: body.contactId }),
        ...(body.dateEcheance !== undefined && { dateEcheance: new Date(body.dateEcheance) }),
        ...(body.conditions !== undefined && { conditions: body.conditions }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.statut !== undefined && { statut: body.statut }),
        totalHT,
        totalTVA,
        totalTTC,
        resteARegler,
        lignes: { create: lignesData },
      },
      include: {
        contact: true,
        devis: { select: { id: true, numero: true, objet: true } },
        lignes: { orderBy: { ordre: 'asc' } },
        paiements: { orderBy: { date: 'desc' } },
      },
    });

    return NextResponse.json(facture);
  }

  // Mise a jour simple (conditions, notes, etc.)
  const facture = await prisma.facture.update({
    where: { id },
    data: {
      ...(body.conditions !== undefined && { conditions: body.conditions }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.dateEcheance !== undefined && { dateEcheance: new Date(body.dateEcheance) }),
      ...(body.statut !== undefined && { statut: body.statut }),
    },
    include: {
      contact: true,
      devis: { select: { id: true, numero: true, objet: true } },
      lignes: { orderBy: { ordre: 'asc' } },
      paiements: { orderBy: { date: 'desc' } },
    },
  });

  return NextResponse.json(facture);
}

// DELETE /api/factures/:id — Supprimer (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.facture.findFirst({
    where: { id, userId: userId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Facture non trouvee.' }, { status: 404 });
  }

  // On ne peut supprimer qu'un brouillon
  if (existing.statut !== 'BROUILLON' && existing.statut !== 'ANNULEE') {
    return NextResponse.json(
      { error: 'Seuls les brouillons et factures annulees peuvent etre supprimes.' },
      { status: 400 },
    );
  }

  await prisma.facture.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
