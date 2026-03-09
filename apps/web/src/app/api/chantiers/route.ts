import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/chantiers?search=...&statut=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const statut = searchParams.get('statut') || '';

    const where: Record<string, unknown> = {
      userId: TEMP_USER_ID,
      deletedAt: null,
    };

    if (statut) {
      where.statut = statut;
    }

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { adresse: { contains: search, mode: 'insensitive' } },
        { ville: { contains: search, mode: 'insensitive' } },
      ];
    }

    const chantiers = await prisma.chantier.findMany({
      where,
      include: {
        client: { select: { id: true, nom: true, prenom: true, entreprise: true, telephone: true } },
        _count: { select: { devis: true, factures: true, achats: true, frais: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute financial summary per chantier
    const result = await Promise.all(chantiers.map(async (c) => {
      const facturesAgg = await prisma.facture.aggregate({
        where: { chantierId: c.id, deletedAt: null, statut: { not: 'ANNULEE' } },
        _sum: { totalTTC: true, montantPaye: true },
      });
      const achatsAgg = await prisma.ficheAchat.aggregate({
        where: { chantierId: c.id, deletedAt: null },
        _sum: { montantTTC: true },
      });
      const fraisAgg = await prisma.noteFrais.aggregate({
        where: { chantierId: c.id, deletedAt: null },
        _sum: { montant: true },
      });

      const caFacture = Number(facturesAgg._sum.totalTTC || 0);
      const couts = Number(achatsAgg._sum.montantTTC || 0) + Number(fraisAgg._sum.montant || 0);

      return {
        ...c,
        caFacture,
        couts,
        marge: caFacture - couts,
        encaisse: Number(facturesAgg._sum.montantPaye || 0),
      };
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/chantiers error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/chantiers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom, clientId, adresse, codePostal, ville, statut, dateDebut, dateFin, description, notes, budgetPrevu } = body;

    if (!nom) {
      return NextResponse.json({ error: 'Le nom du chantier est requis.' }, { status: 400 });
    }

    const chantier = await prisma.chantier.create({
      data: {
        userId: TEMP_USER_ID,
        nom,
        clientId: clientId || null,
        adresse: adresse || null,
        codePostal: codePostal || null,
        ville: ville || null,
        statut: statut || 'EN_ATTENTE',
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: dateFin ? new Date(dateFin) : null,
        description: description || null,
        notes: notes || null,
        budgetPrevu: budgetPrevu ? parseFloat(budgetPrevu) : null,
      },
      include: {
        client: { select: { id: true, nom: true, prenom: true, entreprise: true } },
      },
    });

    return NextResponse.json(chantier, { status: 201 });
  } catch (error) {
    console.error('POST /api/chantiers error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
