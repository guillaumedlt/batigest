import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/factures — Liste des factures
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const statut = searchParams.get('statut') || undefined;
  const type = searchParams.get('type') || undefined;

  const factures = await prisma.facture.findMany({
    where: {
      userId: TEMP_USER_ID,
      deletedAt: null,
      ...(statut ? { statut: statut as 'BROUILLON' | 'EMISE' | 'PAYEE_PARTIELLEMENT' | 'PAYEE' | 'ANNULEE' } : {}),
      ...(type ? { type: type as 'CLASSIQUE' | 'ACOMPTE' | 'SITUATION' | 'AVOIR' } : {}),
      ...(search
        ? {
            OR: [
              { numero: { contains: search, mode: 'insensitive' } },
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
      devis: {
        select: { id: true, numero: true, objet: true },
      },
      chantier: {
        select: { id: true, nom: true },
      },
      _count: { select: { lignes: true, paiements: true } },
    },
    orderBy: { dateEmission: 'desc' },
  });

  return NextResponse.json(factures);
}

// POST /api/factures — Creer une facture
export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.contactId) {
    return NextResponse.json(
      { error: 'Le client est obligatoire.' },
      { status: 400 },
    );
  }

  // Verifier le contact
  const contact = await prisma.contact.findFirst({
    where: { id: body.contactId, userId: TEMP_USER_ID, deletedAt: null },
  });
  if (!contact) {
    return NextResponse.json({ error: 'Contact non trouve.' }, { status: 404 });
  }

  // Generer le numero sequentiel
  const entreprise = await prisma.entreprise.findFirst({
    where: { userId: TEMP_USER_ID },
  });

  const year = new Date().getFullYear();
  const factureType = body.type || 'CLASSIQUE';
  let sequenceNum = 1;
  const prefix = factureType === 'AVOIR' ? 'A' : 'F';

  if (entreprise) {
    if (factureType === 'AVOIR') {
      const updated = await prisma.entreprise.update({
        where: { id: entreprise.id },
        data: { sequenceAvoir: { increment: 1 } },
      });
      sequenceNum = updated.sequenceAvoir;
    } else {
      const updated = await prisma.entreprise.update({
        where: { id: entreprise.id },
        data: { sequenceFacture: { increment: 1 } },
      });
      sequenceNum = updated.sequenceFacture;
    }
  } else {
    const count = await prisma.facture.count({
      where: { userId: TEMP_USER_ID, type: factureType === 'AVOIR' ? 'AVOIR' : { not: 'AVOIR' } },
    });
    sequenceNum = count + 1;
  }

  const numero = `${prefix}-${year}-${String(sequenceNum).padStart(3, '0')}`;

  // Si franchise en base, forcer TVA a 0
  const isFranchise = entreprise?.franchiseTVA || entreprise?.regimeTVA === 'FRANCHISE';

  // Calculer les totaux
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
    avancement?: number;
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
      avancement: ligne.avancement ? new Prisma.Decimal(ligne.avancement) : null,
      ordre: index + 1,
    };
  });

  const totalTTC = totalHT.add(totalTVA);

  // Date d'echeance par defaut : 30 jours
  const dateEcheance = body.dateEcheance
    ? new Date(body.dateEcheance)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const facture = await prisma.facture.create({
    data: {
      userId: TEMP_USER_ID,
      contactId: body.contactId,
      devisId: body.devisId || null,
      chantierId: body.chantierId || null,
      numero,
      type: factureType,
      dateEcheance,
      dateExecution: body.dateExecution ? new Date(body.dateExecution) : null,
      totalHT,
      totalTVA,
      totalTTC,
      montantPaye: 0,
      resteARegler: totalTTC,
      conditions: body.conditions || null,
      notes: body.notes || null,
      pourcentage: body.pourcentage ? new Prisma.Decimal(body.pourcentage) : null,
      factureParentId: body.factureParentId || null,
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

  return NextResponse.json(facture, { status: 201 });
}
