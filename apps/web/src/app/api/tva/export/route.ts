import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUserId } from '@/lib/auth/get-user';

// GET /api/tva/export?mois=2026-03 ou ?periode=2026-T1
// Retourne un CSV avec le detail des operations TVA
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    let debut: Date;
    let fin: Date;
    let label: string;
    const mois = searchParams.get('mois');
    const periode = searchParams.get('periode');

    if (mois) {
      const [y, m] = mois.split('-').map(Number);
      debut = new Date(y, m - 1, 1);
      fin = new Date(y, m, 0, 23, 59, 59);
      label = `TVA_${mois}`;
    } else if (periode) {
      const [y, t] = periode.split('-T');
      const trimestre = parseInt(t);
      debut = new Date(parseInt(y), (trimestre - 1) * 3, 1);
      fin = new Date(parseInt(y), trimestre * 3, 0, 23, 59, 59);
      label = `TVA_${periode}`;
    } else {
      const now = new Date();
      debut = new Date(now.getFullYear(), now.getMonth(), 1);
      fin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      label = `TVA_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    // Factures emises (TVA collectee)
    const factures = await prisma.facture.findMany({
      where: {
        userId: userId,
        deletedAt: null,
        statut: { not: 'BROUILLON' },
        dateEmission: { gte: debut, lte: fin },
      },
      include: {
        lignes: true,
        contact: { select: { nom: true, prenom: true, entreprise: true } },
      },
      orderBy: { dateEmission: 'asc' },
    });

    // Achats (TVA deductible)
    const achats = await prisma.ficheAchat.findMany({
      where: {
        userId: userId,
        deletedAt: null,
        date: { gte: debut, lte: fin },
      },
      include: {
        fournisseur: { select: { nom: true, prenom: true, entreprise: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Build CSV
    const lines: string[] = [];
    const sep = ';';

    // Header
    lines.push([
      'Type', 'Date', 'Numero/Designation', 'Client/Fournisseur',
      'Base HT', 'Taux TVA', 'Montant TVA', 'Total TTC',
    ].join(sep));

    // Factures
    for (const f of factures) {
      const client = f.contact.entreprise || `${f.contact.nom} ${f.contact.prenom || ''}`.trim();
      const type = f.type === 'AVOIR' ? 'Avoir' : 'Facture';

      // Une ligne par taux TVA
      const tauxGroupes: Record<string, { ht: number; tva: number }> = {};
      for (const l of f.lignes) {
        const t = l.tauxTVA.toString();
        if (!tauxGroupes[t]) tauxGroupes[t] = { ht: 0, tva: 0 };
        const ht = Number(l.totalHT);
        tauxGroupes[t].ht += ht;
        tauxGroupes[t].tva += ht * Number(l.tauxTVA) / 100;
      }

      for (const [taux, vals] of Object.entries(tauxGroupes)) {
        const sign = f.type === 'AVOIR' ? -1 : 1;
        lines.push([
          type,
          new Date(f.dateEmission).toLocaleDateString('fr-FR'),
          f.numero,
          csvEscape(client),
          formatNum(vals.ht * sign),
          `${taux}%`,
          formatNum(vals.tva * sign),
          formatNum((vals.ht + vals.tva) * sign),
        ].join(sep));
      }
    }

    // Ligne separateur
    lines.push('');
    lines.push(['--- TVA DEDUCTIBLE (Achats) ---', '', '', '', '', '', '', ''].join(sep));

    // Achats
    for (const a of achats) {
      const fourn = a.fournisseur
        ? (a.fournisseur.entreprise || `${a.fournisseur.nom} ${a.fournisseur.prenom || ''}`.trim())
        : 'N/A';
      const ht = Number(a.montantHT);
      const taux = Number(a.tauxTVA);
      const tva = ht * taux / 100;

      lines.push([
        'Achat',
        new Date(a.date).toLocaleDateString('fr-FR'),
        csvEscape(a.designation),
        csvEscape(fourn),
        formatNum(ht),
        `${a.tauxTVA}%`,
        formatNum(tva),
        formatNum(Number(a.montantTTC)),
      ].join(sep));
    }

    // Totaux
    lines.push('');

    let totalCollectee = 0;
    let totalDeductible = 0;
    let totalBaseCollectee = 0;
    let totalBaseDeductible = 0;

    for (const f of factures) {
      const sign = f.type === 'AVOIR' ? -1 : 1;
      for (const l of f.lignes) {
        const ht = Number(l.totalHT);
        totalBaseCollectee += ht * sign;
        totalCollectee += ht * Number(l.tauxTVA) / 100 * sign;
      }
    }
    for (const a of achats) {
      const ht = Number(a.montantHT);
      totalBaseDeductible += ht;
      totalDeductible += ht * Number(a.tauxTVA) / 100;
    }

    const solde = totalCollectee - totalDeductible;

    lines.push(['TOTAL TVA COLLECTEE', '', '', '', formatNum(totalBaseCollectee), '', formatNum(totalCollectee), ''].join(sep));
    lines.push(['TOTAL TVA DEDUCTIBLE', '', '', '', formatNum(totalBaseDeductible), '', formatNum(totalDeductible), ''].join(sep));
    lines.push(['SOLDE (collectee - deductible)', '', '', '', '', '', formatNum(solde), ''].join(sep));
    lines.push([solde > 0 ? 'TVA A PAYER' : solde < 0 ? 'CREDIT DE TVA' : 'SOLDE NUL', '', '', '', '', '', formatNum(Math.abs(solde)), ''].join(sep));

    const csv = '\uFEFF' + lines.join('\r\n'); // BOM UTF-8 pour Excel

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${label}.csv"`,
      },
    });
  } catch (error) {
    console.error('GET /api/tva/export error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

function formatNum(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

function csvEscape(s: string): string {
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
