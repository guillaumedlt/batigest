import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

// Bareme kilometrique fiscal 2024 (voiture)
// https://www.service-public.fr/particuliers/actualites/A14686
const BAREME_KM = [
  { maxKm: 5000, coef: 0.636, fixe: 0 },
  { maxKm: 20000, coef: 0.340, fixe: 1330 },
  { maxKm: Infinity, coef: 0.405, fixe: 0 },
];

function calculIndemniteKm(km: number): number {
  const tranche = BAREME_KM.find((t) => km <= t.maxKm) || BAREME_KM[2];
  return Math.round((km * tranche.coef + tranche.fixe) * 100) / 100;
}

// GET /api/frais — Liste des notes de frais
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categorie = searchParams.get('categorie') || undefined;
    const mois = searchParams.get('mois') || undefined; // format: 2026-03

    const where: Record<string, unknown> = {
      userId: TEMP_USER_ID,
      deletedAt: null,
    };

    if (categorie) {
      where.categorie = categorie;
    }

    if (mois) {
      const [year, month] = mois.split('-').map(Number);
      where.date = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    }

    if (search) {
      where.description = { contains: search, mode: 'insensitive' };
    }

    const frais = await prisma.noteFrais.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // Stats du mois en cours
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const statsMois = await prisma.noteFrais.aggregate({
      where: {
        userId: TEMP_USER_ID,
        deletedAt: null,
        date: { gte: debutMois, lt: finMois },
      },
      _sum: { montant: true },
      _count: true,
    });

    const statsNonRemb = await prisma.noteFrais.aggregate({
      where: {
        userId: TEMP_USER_ID,
        deletedAt: null,
        remboursee: false,
      },
      _sum: { montant: true },
      _count: true,
    });

    return NextResponse.json({
      frais,
      stats: {
        totalMois: statsMois._sum.montant || 0,
        countMois: statsMois._count,
        totalNonRembourse: statsNonRemb._sum.montant || 0,
        countNonRembourse: statsNonRemb._count,
      },
    });
  } catch (error) {
    console.error('GET /api/frais error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/frais — Creer une note de frais
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.description || !body.date || !body.categorie) {
      return NextResponse.json(
        { error: 'La description, la date et la categorie sont obligatoires.' },
        { status: 400 },
      );
    }

    const validCategories = ['CARBURANT', 'PEAGE', 'RESTAURANT', 'FOURNITURES', 'PARKING', 'KILOMETRIQUE', 'AUTRE'];
    if (!validCategories.includes(body.categorie)) {
      return NextResponse.json({ error: 'Categorie invalide.' }, { status: 400 });
    }

    let montant: number;
    let km: number | null = null;
    let tva: Prisma.Decimal | null = null;

    if (body.categorie === 'KILOMETRIQUE') {
      // Calcul automatique avec le bareme
      if (!body.km || body.km <= 0) {
        return NextResponse.json({ error: 'Le nombre de kilometres est obligatoire pour les indemnites kilometriques.' }, { status: 400 });
      }
      km = Number(body.km);
      montant = calculIndemniteKm(km);
    } else {
      if (!body.montant || Number(body.montant) <= 0) {
        return NextResponse.json({ error: 'Le montant est obligatoire.' }, { status: 400 });
      }
      montant = Number(body.montant);
      if (body.tva !== undefined && body.tva !== null) {
        tva = new Prisma.Decimal(body.tva);
      }
    }

    const note = await prisma.noteFrais.create({
      data: {
        userId: TEMP_USER_ID,
        date: new Date(body.date),
        categorie: body.categorie,
        montant: new Prisma.Decimal(montant),
        tva,
        description: body.description,
        photoUrl: body.photoUrl || null,
        chantierId: body.chantierId || null,
        km: km ? new Prisma.Decimal(km) : null,
        remboursee: false,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('POST /api/frais error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
