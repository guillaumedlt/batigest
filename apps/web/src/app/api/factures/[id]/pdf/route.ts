import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUserId } from '@/lib/auth/get-user';
import { generateFacturePdfHtml } from '@/lib/pdf/html-document';

// GET /api/factures/:id/pdf — HTML print-optimized de la facture
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
  }

  const { id } = await params;

  const facture = await prisma.facture.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      contact: true,
      devis: { select: { id: true, numero: true, objet: true } },
      lignes: { orderBy: { ordre: 'asc' } },
      paiements: { orderBy: { date: 'desc' } },
    },
  });

  if (!facture) {
    return NextResponse.json({ error: 'Facture non trouvee.' }, { status: 404 });
  }

  const entreprise = await prisma.entreprise.findFirst({
    where: { userId },
  });

  if (!entreprise) {
    return NextResponse.json({ error: 'Entreprise non configuree.' }, { status: 404 });
  }

  const html = generateFacturePdfHtml(
    {
      numero: facture.numero,
      type: facture.type,
      dateEmission: facture.dateEmission.toISOString(),
      dateEcheance: facture.dateEcheance.toISOString(),
      totalHT: facture.totalHT.toString(),
      totalTVA: facture.totalTVA.toString(),
      totalTTC: facture.totalTTC.toString(),
      montantPaye: facture.montantPaye.toString(),
      resteARegler: facture.resteARegler.toString(),
      conditions: facture.conditions,
      contact: {
        nom: facture.contact.nom,
        prenom: facture.contact.prenom,
        entreprise: facture.contact.entreprise,
        adresse: facture.contact.adresse,
        codePostal: facture.contact.codePostal,
        ville: facture.contact.ville,
        telephone: facture.contact.telephone,
        email: facture.contact.email,
      },
      devis: facture.devis ? { numero: facture.devis.numero, objet: facture.devis.objet } : null,
      lignes: facture.lignes.map((l) => ({
        designation: l.designation,
        description: l.description,
        quantite: l.quantite.toString(),
        unite: l.unite,
        prixUnitaireHT: l.prixUnitaireHT.toString(),
        tauxTVA: l.tauxTVA.toString(),
        totalHT: l.totalHT.toString(),
      })),
    },
    {
      nomEntreprise: entreprise.nomEntreprise,
      adresse: entreprise.adresse,
      codePostal: entreprise.codePostal,
      ville: entreprise.ville,
      telephone: entreprise.telephone,
      email: entreprise.email,
      siret: entreprise.siret,
      tvaIntracom: entreprise.tvaIntracom,
      assuranceDecennale: entreprise.assuranceDecennale,
      assuranceNumero: entreprise.assuranceNumero,
      rib: entreprise.rib,
      logoUrl: entreprise.logoUrl,
      docCouleur: entreprise.docCouleur,
      docPolice: entreprise.docPolice,
      franchiseTVA: entreprise.franchiseTVA,
      mentionsDevis: entreprise.mentionsDevis,
      mentionsFacture: entreprise.mentionsFacture,
      conditionsReglement: entreprise.conditionsReglement,
    },
  );

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
