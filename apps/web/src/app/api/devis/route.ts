import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { getAuthUserId } from '@/lib/auth/get-user';

// GET /api/devis — Liste des devis
export async function GET(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const statut = searchParams.get('statut') || undefined;

  const devis = await prisma.devis.findMany({
    where: {
      userId: userId,
      deletedAt: null,
      ...(statut ? { statut: statut as 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'EXPIRE' } : {}),
      ...(search
        ? {
            OR: [
              { numero: { contains: search, mode: 'insensitive' } },
              { objet: { contains: search, mode: 'insensitive' } },
              { contact: { nom: { contains: search, mode: 'insensitive' } } },
              { contact: { entreprise: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      contact: {
        select: { id: true, nom: true, prenom: true, entreprise: true },
      },
      chantier: {
        select: { id: true, nom: true },
      },
      _count: { select: { lignes: true } },
    },
    orderBy: { dateCreation: 'desc' },
  });

  return NextResponse.json(devis);
}

// POST /api/devis — Creer un devis
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.contactId || !body.objet) {
    return NextResponse.json(
      { error: 'Le client et l\'objet du devis sont obligatoires.' },
      { status: 400 },
    );
  }

  // Verifier que le contact existe
  const contact = await prisma.contact.findFirst({
    where: { id: body.contactId, userId: userId, deletedAt: null },
  });
  if (!contact) {
    return NextResponse.json({ error: 'Contact non trouve.' }, { status: 404 });
  }

  // Generer le numero sequentiel
  const entreprise = await prisma.entreprise.findFirst({
    where: { userId: userId },
  });

  const year = new Date().getFullYear();
  let sequenceNum = 1;

  if (entreprise) {
    const updated = await prisma.entreprise.update({
      where: { id: entreprise.id },
      data: { sequenceDevis: { increment: 1 } },
    });
    sequenceNum = updated.sequenceDevis;
  } else {
    // Pas d'entreprise, compter les devis existants
    const count = await prisma.devis.count({ where: { userId: userId } });
    sequenceNum = count + 1;
  }

  const prefixDevis = entreprise?.prefixDevis || 'D';
  const numero = `${prefixDevis}-${year}-${String(sequenceNum).padStart(3, '0')}`;

  // Si franchise en base, forcer TVA a 0
  const isFranchise = entreprise?.franchiseTVA || entreprise?.regimeTVA === 'FRANCHISE';

  // Calculer les totaux a partir des lignes
  const lignes = body.lignes || [];
  let totalHT = new Prisma.Decimal(0);
  let totalTVA = new Prisma.Decimal(0);

  const lignesData = lignes.map((ligne: {
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
    const taux = isFranchise ? new Prisma.Decimal(0) : new Prisma.Decimal(ligne.tauxTVA);
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

  // Appliquer la remise globale
  const remise = body.remise ? new Prisma.Decimal(body.remise) : null;
  if (remise) {
    totalHT = totalHT.sub(remise);
    // Recalculer TVA proportionnellement
    const ratio = totalHT.div(totalHT.add(remise));
    totalTVA = totalTVA.mul(ratio);
  }

  const totalTTC = totalHT.add(totalTVA);

  // Date de validite par defaut : 30 jours
  const dateValidite = body.dateValidite
    ? new Date(body.dateValidite)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const devis = await prisma.devis.create({
    data: {
      userId: userId,
      contactId: body.contactId,
      chantierId: body.chantierId || null,
      numero,
      objet: body.objet,
      dateValidite,
      totalHT,
      totalTVA,
      totalTTC,
      remise,
      conditions: body.conditions || null,
      notes: body.notes || null,
      lignes: {
        create: lignesData,
      },
    },
    include: {
      contact: {
        select: { id: true, nom: true, prenom: true, entreprise: true },
      },
      lignes: { orderBy: { ordre: 'asc' } },
    },
  });

  return NextResponse.json(devis, { status: 201 });
}
