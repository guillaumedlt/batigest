import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/dashboard/stats
export async function GET() {
  try {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Devis en attente (ENVOYE)
    const devisEnAttente = await prisma.devis.count({
      where: { userId: TEMP_USER_ID, deletedAt: null, statut: 'ENVOYE' },
    });

    // Factures impayees (EMISE ou PAYEE_PARTIELLEMENT)
    const facturesImpayees = await prisma.facture.findMany({
      where: {
        userId: TEMP_USER_ID,
        deletedAt: null,
        statut: { in: ['EMISE', 'PAYEE_PARTIELLEMENT'] },
      },
      select: { resteARegler: true, dateEcheance: true },
    });
    const nbImpayees = facturesImpayees.length;
    const totalImpayes = facturesImpayees.reduce((s, f) => s + Number(f.resteARegler), 0);
    const nbRetard = facturesImpayees.filter((f) => new Date(f.dateEcheance) < now).length;

    // CA du mois (factures emises ce mois, hors annulees et brouillons)
    const facturesMois = await prisma.facture.aggregate({
      where: {
        userId: TEMP_USER_ID,
        deletedAt: null,
        statut: { notIn: ['BROUILLON', 'ANNULEE'] },
        dateEmission: { gte: debutMois, lte: finMois },
      },
      _sum: { totalTTC: true },
      _count: true,
    });
    const caMois = Number(facturesMois._sum.totalTTC || 0);
    const nbFacturesMois = facturesMois._count;

    // Encaissements du mois
    const encaissementsMois = await prisma.paiement.aggregate({
      where: {
        date: { gte: debutMois, lte: finMois },
        facture: { userId: TEMP_USER_ID, deletedAt: null },
      },
      _sum: { montant: true },
    });
    const totalEncaisse = Number(encaissementsMois._sum.montant || 0);

    // Depenses du mois (achats + frais)
    const achatsMois = await prisma.ficheAchat.aggregate({
      where: {
        userId: TEMP_USER_ID,
        deletedAt: null,
        date: { gte: debutMois, lte: finMois },
      },
      _sum: { montantTTC: true },
    });
    const fraisMois = await prisma.noteFrais.aggregate({
      where: {
        userId: TEMP_USER_ID,
        deletedAt: null,
        date: { gte: debutMois, lte: finMois },
      },
      _sum: { montant: true },
    });
    const depensesMois = Number(achatsMois._sum.montantTTC || 0) + Number(fraisMois._sum.montant || 0);

    // CA sur 6 derniers mois
    const caMensuel: { mois: string; ca: number; depenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const f = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const moisLabel = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

      const facAgg = await prisma.facture.aggregate({
        where: {
          userId: TEMP_USER_ID,
          deletedAt: null,
          statut: { notIn: ['BROUILLON', 'ANNULEE'] },
          dateEmission: { gte: d, lte: f },
        },
        _sum: { totalTTC: true },
      });

      const achAgg = await prisma.ficheAchat.aggregate({
        where: { userId: TEMP_USER_ID, deletedAt: null, date: { gte: d, lte: f } },
        _sum: { montantTTC: true },
      });
      const frAgg = await prisma.noteFrais.aggregate({
        where: { userId: TEMP_USER_ID, deletedAt: null, date: { gte: d, lte: f } },
        _sum: { montant: true },
      });

      caMensuel.push({
        mois: moisLabel,
        ca: Number(facAgg._sum.totalTTC || 0),
        depenses: Number(achAgg._sum.montantTTC || 0) + Number(frAgg._sum.montant || 0),
      });
    }

    // Chantiers en cours
    const chantiersEnCours = await prisma.chantier.findMany({
      where: { userId: TEMP_USER_ID, deletedAt: null, statut: 'EN_COURS' },
      select: { id: true, nom: true, ville: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    // Evenements aujourd'hui et demain
    const debutJour = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const finDemain = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
    const evenements = await prisma.evenement.findMany({
      where: {
        userId: TEMP_USER_ID,
        deletedAt: null,
        dateDebut: { gte: debutJour, lt: finDemain },
      },
      select: { id: true, titre: true, type: true, dateDebut: true, journeeEntiere: true },
      orderBy: { dateDebut: 'asc' },
      take: 8,
    });

    // Activite recente
    const [dernDevis, dernFactures] = await Promise.all([
      prisma.devis.findMany({
        where: { userId: TEMP_USER_ID, deletedAt: null },
        select: { id: true, numero: true, objet: true, statut: true, totalTTC: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.facture.findMany({
        where: { userId: TEMP_USER_ID, deletedAt: null },
        select: { id: true, numero: true, type: true, statut: true, totalTTC: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      devisEnAttente,
      nbImpayees,
      totalImpayes,
      nbRetard,
      caMois,
      nbFacturesMois,
      totalEncaisse,
      depensesMois,
      caMensuel,
      chantiersEnCours,
      evenements,
      dernDevis,
      dernFactures,
    });
  } catch (error) {
    console.error('GET /api/dashboard/stats error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
