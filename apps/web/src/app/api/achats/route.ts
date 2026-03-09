import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/achats — Liste des fiches d'achat
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categorie = searchParams.get('categorie') || undefined;

    const achats = await prisma.ficheAchat.findMany({
      where: {
        userId: TEMP_USER_ID,
        deletedAt: null,
        ...(categorie ? { categorie: categorie as 'MATERIAUX' | 'OUTILLAGE' | 'LOCATION' | 'SOUS_TRAITANCE' | 'AUTRE' } : {}),
        ...(search
          ? {
              OR: [
                { designation: { contains: search, mode: 'insensitive' } },
                { notes: { contains: search, mode: 'insensitive' } },
                { chantierId: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        fournisseur: { select: { id: true, nom: true, prenom: true, entreprise: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(achats);
  } catch (error) {
    console.error('GET /api/achats error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/achats — Creer une fiche d'achat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.designation || !body.date || !body.categorie || body.montantHT === undefined || body.tauxTVA === undefined) {
      return NextResponse.json(
        { error: 'La designation, la date, la categorie, le montant HT et le taux TVA sont obligatoires.' },
        { status: 400 },
      );
    }

    const validCategories = ['MATERIAUX', 'OUTILLAGE', 'LOCATION', 'SOUS_TRAITANCE', 'AUTRE'];
    if (!validCategories.includes(body.categorie)) {
      return NextResponse.json(
        { error: 'Categorie invalide.' },
        { status: 400 },
      );
    }

    const montantHT = new Prisma.Decimal(body.montantHT);
    const tauxTVA = new Prisma.Decimal(body.tauxTVA);
    const montantTTC = montantHT.add(montantHT.mul(tauxTVA).div(100));

    const achat = await prisma.ficheAchat.create({
      data: {
        userId: TEMP_USER_ID,
        fournisseurId: body.fournisseurId || null,
        date: new Date(body.date),
        designation: body.designation,
        categorie: body.categorie,
        montantHT,
        tauxTVA,
        montantTTC,
        photoUrl: body.photoUrl || null,
        notes: body.notes || null,
        chantierId: body.chantierId || null,
      },
      include: {
        fournisseur: { select: { id: true, nom: true, prenom: true, entreprise: true } },
      },
    });

    return NextResponse.json(achat, { status: 201 });
  } catch (error) {
    console.error('POST /api/achats error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
