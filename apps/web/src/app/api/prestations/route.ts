import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/prestations?search=...&categorie=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categorie = searchParams.get('categorie') || '';

    const where: Record<string, unknown> = { userId: TEMP_USER_ID };

    if (search) {
      where.OR = [
        { designation: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { categorie: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categorie) {
      where.categorie = categorie;
    }

    const prestations = await prisma.prestation.findMany({
      where,
      orderBy: [{ categorie: 'asc' }, { designation: 'asc' }],
    });

    return NextResponse.json(prestations);
  } catch (error) {
    console.error('GET /api/prestations error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/prestations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { designation, description, unite, prixUnitaireHT, tauxTVA, categorie } = body;

    if (!designation || !unite || prixUnitaireHT === undefined) {
      return NextResponse.json({ error: 'Designation, unite et prix sont requis.' }, { status: 400 });
    }

    const prestation = await prisma.prestation.create({
      data: {
        userId: TEMP_USER_ID,
        designation,
        description: description || null,
        unite,
        prixUnitaireHT: parseFloat(prixUnitaireHT),
        tauxTVA: parseFloat(tauxTVA || '20'),
        categorie: categorie || null,
      },
    });

    return NextResponse.json(prestation, { status: 201 });
  } catch (error) {
    console.error('POST /api/prestations error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE (via body for batch) — or single via query
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await prisma.prestation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/prestations error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
