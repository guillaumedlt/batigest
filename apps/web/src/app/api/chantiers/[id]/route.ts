import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUserId } from '@/lib/auth/get-user';

// GET /api/chantiers/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }

    const { id } = await params;
    const chantier = await prisma.chantier.findFirst({
      where: { id, userId: userId, deletedAt: null },
      include: {
        client: { select: { id: true, nom: true, prenom: true, entreprise: true, telephone: true, email: true } },
        devis: {
          where: { deletedAt: null },
          select: { id: true, numero: true, objet: true, statut: true, totalTTC: true, dateCreation: true },
          orderBy: { dateCreation: 'desc' },
        },
        factures: {
          where: { deletedAt: null },
          select: { id: true, numero: true, type: true, statut: true, totalTTC: true, montantPaye: true, resteARegler: true, dateEmission: true },
          orderBy: { dateEmission: 'desc' },
        },
        achats: {
          where: { deletedAt: null },
          select: { id: true, designation: true, categorie: true, montantTTC: true, date: true },
          orderBy: { date: 'desc' },
        },
        frais: {
          where: { deletedAt: null },
          select: { id: true, description: true, categorie: true, montant: true, date: true },
          orderBy: { date: 'desc' },
        },
        evenements: {
          where: { deletedAt: null },
          select: { id: true, titre: true, type: true, dateDebut: true, dateFin: true },
          orderBy: { dateDebut: 'desc' },
          take: 10,
        },
      },
    });

    if (!chantier) {
      return NextResponse.json({ error: 'Chantier non trouvé' }, { status: 404 });
    }

    // Compute totals
    const totalFacture = chantier.factures
      .filter((f) => f.statut !== 'ANNULEE')
      .reduce((s, f) => s + Number(f.totalTTC), 0);
    const totalEncaisse = chantier.factures
      .reduce((s, f) => s + Number(f.montantPaye), 0);
    const totalAchats = chantier.achats.reduce((s, a) => s + Number(a.montantTTC), 0);
    const totalFrais = chantier.frais.reduce((s, f) => s + Number(f.montant), 0);
    const totalCouts = totalAchats + totalFrais;

    return NextResponse.json({
      ...chantier,
      totalFacture,
      totalEncaisse,
      totalAchats,
      totalFrais,
      totalCouts,
      marge: totalFacture - totalCouts,
    });
  } catch (error) {
    console.error('GET /api/chantiers/[id] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/chantiers/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const fields = ['nom', 'clientId', 'adresse', 'codePostal', 'ville', 'statut', 'dateDebut', 'dateFin', 'description', 'notes', 'budgetPrevu'];
    const data: Record<string, unknown> = {};

    for (const field of fields) {
      if (field in body) {
        if (field === 'dateDebut' || field === 'dateFin') {
          data[field] = body[field] ? new Date(body[field]) : null;
        } else if (field === 'budgetPrevu') {
          data[field] = body[field] ? parseFloat(body[field]) : null;
        } else {
          data[field] = body[field] || null;
        }
      }
    }

    const chantier = await prisma.chantier.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, nom: true, prenom: true, entreprise: true } },
      },
    });

    return NextResponse.json(chantier);
  } catch (error) {
    console.error('PATCH /api/chantiers/[id] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/chantiers/[id] (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.chantier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/chantiers/[id] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
