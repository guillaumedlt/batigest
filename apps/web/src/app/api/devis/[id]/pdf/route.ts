import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUserId } from '@/lib/auth/get-user';
import { generateDevisPdfHtml } from '@/lib/pdf/html-document';

// GET /api/devis/:id/pdf — HTML print-optimized du devis
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
  }

  const { id } = await params;

  const devis = await prisma.devis.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      contact: true,
      lignes: { orderBy: { ordre: 'asc' } },
    },
  });

  if (!devis) {
    return NextResponse.json({ error: 'Devis non trouve.' }, { status: 404 });
  }

  const entreprise = await prisma.entreprise.findFirst({
    where: { userId },
  });

  if (!entreprise) {
    return NextResponse.json({ error: 'Entreprise non configuree.' }, { status: 404 });
  }

  const html = generateDevisPdfHtml(
    {
      numero: devis.numero,
      objet: devis.objet,
      dateCreation: devis.dateCreation.toISOString(),
      dateValidite: devis.dateValidite.toISOString(),
      totalHT: devis.totalHT.toString(),
      totalTVA: devis.totalTVA.toString(),
      totalTTC: devis.totalTTC.toString(),
      remise: devis.remise?.toString() ?? null,
      conditions: devis.conditions,
      contact: {
        nom: devis.contact.nom,
        prenom: devis.contact.prenom,
        entreprise: devis.contact.entreprise,
        adresse: devis.contact.adresse,
        codePostal: devis.contact.codePostal,
        ville: devis.contact.ville,
        telephone: devis.contact.telephone,
        email: devis.contact.email,
      },
      lignes: devis.lignes.map((l) => ({
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
