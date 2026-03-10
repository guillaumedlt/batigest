import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUserId } from '@/lib/auth/get-user';

// GET /api/evenements — Liste des evenements (par plage de dates)
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const debut = searchParams.get('debut');
    const fin = searchParams.get('fin');
    const type = searchParams.get('type') || undefined;

    const where: Record<string, unknown> = {
      userId: userId,
      deletedAt: null,
    };

    if (debut && fin) {
      where.dateDebut = { lte: new Date(fin) };
      where.dateFin = { gte: new Date(debut) };
    }

    if (type) {
      where.type = type;
    }

    const evenements = await prisma.evenement.findMany({
      where,
      include: {
        contact: {
          select: { id: true, nom: true, prenom: true, entreprise: true, telephone: true },
        },
      },
      orderBy: { dateDebut: 'asc' },
    });

    return NextResponse.json(evenements);
  } catch (error) {
    console.error('GET /api/evenements error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/evenements — Creer un evenement
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.titre || !body.dateDebut || !body.type) {
      return NextResponse.json(
        { error: 'Le titre, la date et le type sont obligatoires.' },
        { status: 400 },
      );
    }

    const validTypes = ['CHANTIER', 'RDV_CLIENT', 'RDV_FOURNISSEUR', 'RELANCE', 'PERSO'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json({ error: 'Type d\'evenement invalide.' }, { status: 400 });
    }

    // Si journee entiere, mettre debut a 00:00 et fin a 23:59
    let dateDebut = new Date(body.dateDebut);
    let dateFin = body.dateFin ? new Date(body.dateFin) : null;

    if (body.journeeEntiere) {
      dateDebut = new Date(dateDebut.toISOString().split('T')[0] + 'T00:00:00.000Z');
      dateFin = dateFin
        ? new Date(dateFin.toISOString().split('T')[0] + 'T23:59:59.999Z')
        : new Date(dateDebut.toISOString().split('T')[0] + 'T23:59:59.999Z');
    } else if (!dateFin) {
      // Par defaut, 1h de duree
      dateFin = new Date(dateDebut.getTime() + 60 * 60 * 1000);
    }

    // Verifier que le contact existe si fourni
    if (body.contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: body.contactId, userId: userId, deletedAt: null },
      });
      if (!contact) {
        return NextResponse.json({ error: 'Contact non trouve.' }, { status: 404 });
      }
    }

    const evenement = await prisma.evenement.create({
      data: {
        userId: userId,
        titre: body.titre,
        type: body.type,
        dateDebut,
        dateFin,
        journeeEntiere: body.journeeEntiere || false,
        contactId: body.contactId || null,
        adresse: body.adresse || null,
        notes: body.notes || null,
        rappel: body.rappel !== undefined ? body.rappel : null,
        couleur: body.couleur || null,
      },
      include: {
        contact: {
          select: { id: true, nom: true, prenom: true, entreprise: true },
        },
      },
    });

    return NextResponse.json(evenement, { status: 201 });
  } catch (error) {
    console.error('POST /api/evenements error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
