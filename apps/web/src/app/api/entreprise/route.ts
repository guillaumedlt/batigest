import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUserId } from '@/lib/auth/get-user';

// GET /api/entreprise — Infos entreprise
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }

    const entreprise = await prisma.entreprise.findFirst({
      where: { userId: userId },
    });

    if (!entreprise) {
      return NextResponse.json({ error: 'Entreprise non configuree.' }, { status: 404 });
    }

    return NextResponse.json(entreprise);
  } catch (error) {
    console.error('GET /api/entreprise error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/entreprise — Modifier les infos entreprise
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }

    const body = await request.json();

    const entreprise = await prisma.entreprise.findFirst({
      where: { userId: userId },
    });

    if (!entreprise) {
      return NextResponse.json({ error: 'Entreprise non configuree.' }, { status: 404 });
    }

    // Valider le regime TVA si fourni
    if (body.regimeTVA !== undefined) {
      const validRegimes = ['FRANCHISE', 'REEL_SIMPLIFIE', 'REEL_NORMAL'];
      if (!validRegimes.includes(body.regimeTVA)) {
        return NextResponse.json({ error: 'Regime TVA invalide.' }, { status: 400 });
      }
      // Synchroniser franchiseTVA avec le regime
      body.franchiseTVA = body.regimeTVA === 'FRANCHISE';
    }

    const updated = await prisma.entreprise.update({
      where: { id: entreprise.id },
      data: {
        ...(body.nomEntreprise !== undefined ? { nomEntreprise: body.nomEntreprise } : {}),
        ...(body.formeJuridique !== undefined ? { formeJuridique: body.formeJuridique } : {}),
        ...(body.siret !== undefined ? { siret: body.siret } : {}),
        ...(body.rcsRm !== undefined ? { rcsRm: body.rcsRm } : {}),
        ...(body.tvaIntracom !== undefined ? { tvaIntracom: body.tvaIntracom } : {}),
        ...(body.adresse !== undefined ? { adresse: body.adresse } : {}),
        ...(body.codePostal !== undefined ? { codePostal: body.codePostal } : {}),
        ...(body.ville !== undefined ? { ville: body.ville } : {}),
        ...(body.telephone !== undefined ? { telephone: body.telephone } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.metier !== undefined ? { metier: body.metier } : {}),
        ...(body.assuranceDecennale !== undefined ? { assuranceDecennale: body.assuranceDecennale } : {}),
        ...(body.assuranceNumero !== undefined ? { assuranceNumero: body.assuranceNumero } : {}),
        ...(body.assuranceZone !== undefined ? { assuranceZone: body.assuranceZone } : {}),
        ...(body.franchiseTVA !== undefined ? { franchiseTVA: body.franchiseTVA } : {}),
        ...(body.regimeTVA !== undefined ? { regimeTVA: body.regimeTVA } : {}),
        ...(body.conditionsReglement !== undefined ? { conditionsReglement: body.conditionsReglement } : {}),
        ...(body.mentionsDevis !== undefined ? { mentionsDevis: body.mentionsDevis } : {}),
        ...(body.mentionsFacture !== undefined ? { mentionsFacture: body.mentionsFacture } : {}),
        ...(body.rib !== undefined ? { rib: body.rib } : {}),
        ...(body.docCouleur !== undefined ? { docCouleur: body.docCouleur } : {}),
        ...(body.docPolice !== undefined ? { docPolice: body.docPolice } : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
        ...(body.prefixDevis !== undefined ? { prefixDevis: body.prefixDevis } : {}),
        ...(body.prefixFacture !== undefined ? { prefixFacture: body.prefixFacture } : {}),
        ...(body.prefixAvoir !== undefined ? { prefixAvoir: body.prefixAvoir } : {}),
        ...(body.sequenceDevis !== undefined ? { sequenceDevis: Number(body.sequenceDevis) } : {}),
        ...(body.sequenceFacture !== undefined ? { sequenceFacture: Number(body.sequenceFacture) } : {}),
        ...(body.sequenceAvoir !== undefined ? { sequenceAvoir: Number(body.sequenceAvoir) } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/entreprise error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
