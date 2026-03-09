import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/frais/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const note = await prisma.noteFrais.findFirst({
      where: { id, userId: TEMP_USER_ID, deletedAt: null },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note de frais non trouvee.' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('GET /api/frais/:id error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/frais/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.noteFrais.findFirst({
      where: { id, userId: TEMP_USER_ID, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Note de frais non trouvee.' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.description !== undefined) data.description = body.description;
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.categorie !== undefined) data.categorie = body.categorie;
    if (body.montant !== undefined) data.montant = new Prisma.Decimal(body.montant);
    if (body.tva !== undefined) data.tva = body.tva !== null ? new Prisma.Decimal(body.tva) : null;
    if (body.chantierId !== undefined) data.chantierId = body.chantierId || null;
    if (body.km !== undefined) data.km = body.km !== null ? new Prisma.Decimal(body.km) : null;
    if (body.remboursee !== undefined) data.remboursee = body.remboursee;

    const updated = await prisma.noteFrais.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/frais/:id error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/frais/:id (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await prisma.noteFrais.findFirst({
      where: { id, userId: TEMP_USER_ID, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Note de frais non trouvee.' }, { status: 404 });
    }

    await prisma.noteFrais.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/frais/:id error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
