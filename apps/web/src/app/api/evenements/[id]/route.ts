import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/evenements/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const evenement = await prisma.evenement.findFirst({
      where: { id, userId: TEMP_USER_ID, deletedAt: null },
      include: {
        contact: {
          select: { id: true, nom: true, prenom: true, entreprise: true, telephone: true },
        },
      },
    });

    if (!evenement) {
      return NextResponse.json({ error: 'Evenement non trouve.' }, { status: 404 });
    }

    return NextResponse.json(evenement);
  } catch (error) {
    console.error('GET /api/evenements/:id error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/evenements/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.evenement.findFirst({
      where: { id, userId: TEMP_USER_ID, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Evenement non trouve.' }, { status: 404 });
    }

    // Gerer les dates si journee entiere change
    const data: Record<string, unknown> = {};

    if (body.titre !== undefined) data.titre = body.titre;
    if (body.type !== undefined) data.type = body.type;
    if (body.adresse !== undefined) data.adresse = body.adresse || null;
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.rappel !== undefined) data.rappel = body.rappel;
    if (body.couleur !== undefined) data.couleur = body.couleur || null;
    if (body.contactId !== undefined) data.contactId = body.contactId || null;

    if (body.journeeEntiere !== undefined) {
      data.journeeEntiere = body.journeeEntiere;
    }

    if (body.dateDebut !== undefined) {
      data.dateDebut = new Date(body.dateDebut);
    }
    if (body.dateFin !== undefined) {
      data.dateFin = new Date(body.dateFin);
    }

    const updated = await prisma.evenement.update({
      where: { id },
      data,
      include: {
        contact: {
          select: { id: true, nom: true, prenom: true, entreprise: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/evenements/:id error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/evenements/:id (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await prisma.evenement.findFirst({
      where: { id, userId: TEMP_USER_ID, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Evenement non trouve.' }, { status: 404 });
    }

    await prisma.evenement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/evenements/:id error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
