import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUserId } from '@/lib/auth/get-user';
import { generateFacturXML } from '@/lib/facturx/generate-xml';

/**
 * GET /api/factures/:id/facturx
 * Telecharge le fichier XML Factur-X pour une facture donnee.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }

    const { id } = await params;

    const facture = await prisma.facture.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        contact: {
          select: { nom: true, prenom: true, entreprise: true },
        },
      },
    });

    if (!facture) {
      return NextResponse.json({ error: 'Facture non trouvee.' }, { status: 404 });
    }

    if (facture.statut === 'BROUILLON') {
      return NextResponse.json(
        { error: 'Le format Factur-X n\'est disponible que pour les factures emises.' },
        { status: 400 },
      );
    }

    // Recuperer l'entreprise
    const entreprise = await prisma.entreprise.findFirst({
      where: { userId },
    });

    if (!entreprise) {
      return NextResponse.json(
        { error: 'Veuillez configurer votre entreprise dans les parametres.' },
        { status: 400 },
      );
    }

    const xml = generateFacturXML(
      {
        numero: facture.numero,
        dateEmission: facture.dateEmission,
        type: facture.type,
        totalHT: facture.totalHT.toString(),
        totalTVA: facture.totalTVA.toString(),
        totalTTC: facture.totalTTC.toString(),
      },
      {
        nomEntreprise: entreprise.nomEntreprise,
        siret: entreprise.siret,
        tvaIntracom: entreprise.tvaIntracom,
        adresse: entreprise.adresse,
        codePostal: entreprise.codePostal,
        ville: entreprise.ville,
      },
      {
        nom: facture.contact.nom,
        prenom: facture.contact.prenom,
        entreprise: facture.contact.entreprise,
      },
    );

    const filename = `facturx_${facture.numero.replace(/[^a-zA-Z0-9-]/g, '_')}.xml`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('GET /api/factures/:id/facturx error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
