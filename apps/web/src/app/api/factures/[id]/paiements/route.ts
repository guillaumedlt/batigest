import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

// POST /api/factures/:id/paiements — Enregistrer un paiement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  // Verifier la facture
  const facture = await prisma.facture.findFirst({
    where: { id, userId: TEMP_USER_ID, deletedAt: null },
  });

  if (!facture) {
    return NextResponse.json({ error: 'Facture non trouvee.' }, { status: 404 });
  }

  if (!body.montant || !body.date || !body.mode) {
    return NextResponse.json(
      { error: 'Le montant, la date et le mode de paiement sont obligatoires.' },
      { status: 400 },
    );
  }

  const montant = new Prisma.Decimal(body.montant);

  // Verifier que le montant ne depasse pas le reste a regler
  if (montant.greaterThan(facture.resteARegler)) {
    return NextResponse.json(
      { error: `Le montant depasse le reste a regler (${facture.resteARegler} EUR).` },
      { status: 400 },
    );
  }

  // Creer le paiement
  const paiement = await prisma.paiement.create({
    data: {
      factureId: id,
      montant,
      date: new Date(body.date),
      mode: body.mode,
      reference: body.reference || null,
      notes: body.notes || null,
    },
  });

  // Mettre a jour la facture
  const newMontantPaye = facture.montantPaye.add(montant);
  const newResteARegler = facture.totalTTC.sub(newMontantPaye);
  const newStatut = newResteARegler.lessThanOrEqualTo(0) ? 'PAYEE' : 'PAYEE_PARTIELLEMENT';

  await prisma.facture.update({
    where: { id },
    data: {
      montantPaye: newMontantPaye,
      resteARegler: newResteARegler,
      statut: newStatut,
    },
  });

  return NextResponse.json(paiement, { status: 201 });
}
