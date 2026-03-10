import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUserId } from '@/lib/auth/get-user';

/**
 * GET /api/export/fec?annee=2026
 * Genere le Fichier des Ecritures Comptables (FEC) au format requis par l'article A47 A-1 du LPF.
 * Fichier texte tabule, encodage UTF-8 avec BOM.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const annee = parseInt(searchParams.get('annee') || String(new Date().getFullYear()));

    if (isNaN(annee) || annee < 2000 || annee > 2100) {
      return NextResponse.json({ error: 'Annee invalide.' }, { status: 400 });
    }

    // Recuperer l'entreprise pour le nom
    const entreprise = await prisma.entreprise.findFirst({
      where: { userId },
    });

    const siren = entreprise?.siret?.slice(0, 9) || 'SIREN';

    // Recuperer les factures de l'annee (hors brouillons)
    const debut = new Date(annee, 0, 1);
    const fin = new Date(annee, 11, 31, 23, 59, 59);

    const factures = await prisma.facture.findMany({
      where: {
        userId,
        deletedAt: null,
        statut: { not: 'BROUILLON' },
        dateEmission: { gte: debut, lte: fin },
      },
      include: {
        contact: {
          select: { nom: true, prenom: true, entreprise: true },
        },
        lignes: true,
      },
      orderBy: { dateEmission: 'asc' },
    });

    if (factures.length === 0) {
      return NextResponse.json(
        { error: 'Aucune facture trouvee pour cette annee.' },
        { status: 404 },
      );
    }

    const TAB = '\t';
    const lines: string[] = [];

    // En-tete FEC (obligatoire)
    lines.push([
      'JournalCode',
      'JournalLib',
      'EcritureNum',
      'EcritureDate',
      'CompteNum',
      'CompteLib',
      'CompAuxNum',
      'CompAuxLib',
      'PieceRef',
      'PieceDate',
      'EcritureLib',
      'Debit',
      'Credit',
      'EcrLettrage',
      'DateLettrage',
      'ValidDate',
      'MontantDevise',
      'Idevise',
    ].join(TAB));

    let ecritureNum = 1;

    for (const facture of factures) {
      const isAvoir = facture.type === 'AVOIR';
      const journalCode = isAvoir ? 'AV' : 'VE';
      const journalLib = isAvoir ? 'Journal des avoirs' : 'Journal des ventes';

      const dateEmission = formatDateFEC(facture.dateEmission);
      const clientName = facture.contact.entreprise
        || `${facture.contact.nom}${facture.contact.prenom ? ` ${facture.contact.prenom}` : ''}`;
      const clientRef = `C${facture.contactId.slice(0, 8).toUpperCase()}`;

      const totalHT = Number(facture.totalHT);
      const totalTVA = Number(facture.totalTVA);
      const totalTTC = Number(facture.totalTTC);

      const sign = isAvoir ? -1 : 1;
      const description = `${isAvoir ? 'Avoir' : 'Facture'} ${facture.numero} - ${clientName}`;

      const numStr = String(ecritureNum).padStart(6, '0');

      // Ligne 1 : Debit compte client 411 (TTC)
      lines.push([
        journalCode,
        journalLib,
        numStr,
        dateEmission,
        '411000',
        'Clients',
        clientRef,
        clientName,
        facture.numero,
        dateEmission,
        description,
        formatMontantFEC(Math.max(totalTTC * sign, 0)),
        formatMontantFEC(Math.max(-totalTTC * sign, 0)),
        '',
        '',
        dateEmission,
        '',
        'EUR',
      ].join(TAB));

      // Ligne 2 : Credit compte produit (HT)
      // 706 = Prestations de services, 707 = Vente de marchandises
      // On utilise 706 par defaut (artisans = services)
      lines.push([
        journalCode,
        journalLib,
        numStr,
        dateEmission,
        '706000',
        'Prestations de services',
        '',
        '',
        facture.numero,
        dateEmission,
        description,
        formatMontantFEC(Math.max(-totalHT * sign, 0)),
        formatMontantFEC(Math.max(totalHT * sign, 0)),
        '',
        '',
        dateEmission,
        '',
        'EUR',
      ].join(TAB));

      // Ligne 3 : Credit TVA collectee (si TVA > 0)
      if (totalTVA > 0) {
        lines.push([
          journalCode,
          journalLib,
          numStr,
          dateEmission,
          '445710',
          'TVA collectee',
          '',
          '',
          facture.numero,
          dateEmission,
          description,
          formatMontantFEC(Math.max(-totalTVA * sign, 0)),
          formatMontantFEC(Math.max(totalTVA * sign, 0)),
          '',
          '',
          dateEmission,
          '',
          'EUR',
        ].join(TAB));
      }

      ecritureNum++;
    }

    const content = '\uFEFF' + lines.join('\r\n');
    const filename = `${siren}FEC${annee}1231.txt`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('GET /api/export/fec error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/** Formate une date en YYYYMMDD pour le FEC */
function formatDateFEC(date: Date | string): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/** Formate un montant pour le FEC : virgule comme separateur decimal, 2 decimales */
function formatMontantFEC(n: number): string {
  return n.toFixed(2).replace('.', ',');
}
