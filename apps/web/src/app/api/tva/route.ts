import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUserId } from '@/lib/auth/get-user';

// GET /api/tva?periode=2026-T1 ou ?debut=2026-01-01&fin=2026-03-31 ou ?mois=2026-03
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Determiner la periode
    let debut: Date;
    let fin: Date;
    const mois = searchParams.get('mois'); // 2026-03
    const periode = searchParams.get('periode'); // 2026-T1
    const debutParam = searchParams.get('debut');
    const finParam = searchParams.get('fin');

    if (mois) {
      const [y, m] = mois.split('-').map(Number);
      debut = new Date(y, m - 1, 1);
      fin = new Date(y, m, 0, 23, 59, 59);
    } else if (periode) {
      const [y, t] = periode.split('-T');
      const trimestre = parseInt(t);
      debut = new Date(parseInt(y), (trimestre - 1) * 3, 1);
      fin = new Date(parseInt(y), trimestre * 3, 0, 23, 59, 59);
    } else if (debutParam && finParam) {
      debut = new Date(debutParam);
      fin = new Date(finParam + 'T23:59:59');
    } else {
      // Par defaut: mois en cours
      const now = new Date();
      debut = new Date(now.getFullYear(), now.getMonth(), 1);
      fin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Recuperer le regime TVA de l'entreprise
    const entreprise = await prisma.entreprise.findFirst({
      where: { userId: userId },
    });

    if (!entreprise) {
      return NextResponse.json({ error: 'Entreprise non configuree.' }, { status: 404 });
    }

    // Si franchise en base, pas de TVA
    if (entreprise.franchiseTVA || entreprise.regimeTVA === 'FRANCHISE') {
      return NextResponse.json({
        regime: 'FRANCHISE',
        franchiseTVA: true,
        mention: 'TVA non applicable, article 293 B du Code general des impots',
        periode: { debut: debut.toISOString(), fin: fin.toISOString() },
        collectee: { total: 0, parTaux: {} },
        deductible: { total: 0, parTaux: {} },
        solde: 0,
        credit: 0,
      });
    }

    // === TVA COLLECTEE (depuis les factures emises) ===
    const factures = await prisma.facture.findMany({
      where: {
        userId: userId,
        deletedAt: null,
        statut: { not: 'BROUILLON' },
        dateEmission: { gte: debut, lte: fin },
        type: { not: 'AVOIR' }, // Les avoirs seront soustraits
      },
      include: { lignes: true },
    });

    // Avoirs de la periode (reduisent la TVA collectee)
    const avoirs = await prisma.facture.findMany({
      where: {
        userId: userId,
        deletedAt: null,
        statut: { not: 'BROUILLON' },
        dateEmission: { gte: debut, lte: fin },
        type: 'AVOIR',
      },
      include: { lignes: true },
    });

    // Calculer TVA collectee par taux
    const collecteeParTaux: Record<string, { base: number; tva: number }> = {};
    let totalCollectee = 0;

    for (const f of factures) {
      for (const l of f.lignes) {
        const taux = l.tauxTVA.toString();
        const ht = Number(l.totalHT);
        const tva = ht * Number(l.tauxTVA) / 100;
        if (!collecteeParTaux[taux]) collecteeParTaux[taux] = { base: 0, tva: 0 };
        collecteeParTaux[taux].base += ht;
        collecteeParTaux[taux].tva += tva;
        totalCollectee += tva;
      }
    }

    // Soustraire les avoirs
    for (const a of avoirs) {
      for (const l of a.lignes) {
        const taux = l.tauxTVA.toString();
        const ht = Number(l.totalHT);
        const tva = ht * Number(l.tauxTVA) / 100;
        if (!collecteeParTaux[taux]) collecteeParTaux[taux] = { base: 0, tva: 0 };
        collecteeParTaux[taux].base -= ht;
        collecteeParTaux[taux].tva -= tva;
        totalCollectee -= tva;
      }
    }

    // === TVA DEDUCTIBLE (depuis les achats) ===
    const achats = await prisma.ficheAchat.findMany({
      where: {
        userId: userId,
        deletedAt: null,
        date: { gte: debut, lte: fin },
      },
    });

    const deductibleParTaux: Record<string, { base: number; tva: number }> = {};
    let totalDeductible = 0;

    for (const a of achats) {
      const taux = a.tauxTVA.toString();
      const ht = Number(a.montantHT);
      const tva = ht * Number(a.tauxTVA) / 100;
      if (!deductibleParTaux[taux]) deductibleParTaux[taux] = { base: 0, tva: 0 };
      deductibleParTaux[taux].base += ht;
      deductibleParTaux[taux].tva += tva;
      totalDeductible += tva;
    }

    // === SOLDE ===
    const solde = totalCollectee - totalDeductible;

    // Arrondir a 2 decimales
    const round = (n: number) => Math.round(n * 100) / 100;

    return NextResponse.json({
      regime: entreprise.regimeTVA,
      franchiseTVA: false,
      periode: {
        debut: debut.toISOString(),
        fin: fin.toISOString(),
        label: mois || periode || `${debut.toISOString().split('T')[0]} — ${fin.toISOString().split('T')[0]}`,
      },
      collectee: {
        total: round(totalCollectee),
        nbFactures: factures.length,
        nbAvoirs: avoirs.length,
        parTaux: Object.fromEntries(
          Object.entries(collecteeParTaux).map(([k, v]) => [k, { base: round(v.base), tva: round(v.tva) }])
        ),
      },
      deductible: {
        total: round(totalDeductible),
        nbAchats: achats.length,
        parTaux: Object.fromEntries(
          Object.entries(deductibleParTaux).map(([k, v]) => [k, { base: round(v.base), tva: round(v.tva) }])
        ),
      },
      solde: round(solde), // positif = a payer, negatif = credit
      aPayerOuCredit: solde > 0 ? 'A_PAYER' : solde < 0 ? 'CREDIT' : 'NEUTRE',
    });
  } catch (error) {
    console.error('GET /api/tva error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
