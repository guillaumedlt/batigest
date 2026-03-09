import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/mini-site — Config du mini-site
export async function GET() {
  try {
    const site = await prisma.miniSite.findFirst({
      where: { userId: TEMP_USER_ID },
      include: {
        photos: { orderBy: { ordre: 'asc' } },
        avis: { where: { valide: true }, orderBy: { date: 'desc' } },
      },
    });

    return NextResponse.json(site || { exists: false });
  } catch (error) {
    console.error('GET /api/mini-site error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/mini-site — Creer le mini-site
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.slug || !body.nomEntreprise || !body.metier || !body.telephone || !body.email) {
      return NextResponse.json(
        { error: 'Le slug, nom, metier, telephone et email sont obligatoires.' },
        { status: 400 },
      );
    }

    // Verifier slug unique
    const slugClean = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const existing = await prisma.miniSite.findFirst({
      where: { slug: slugClean },
    });
    if (existing) {
      return NextResponse.json({ error: 'Ce slug est deja pris. Choisissez-en un autre.' }, { status: 409 });
    }

    // Verifier qu'il n'en a pas deja un
    const existingUser = await prisma.miniSite.findFirst({
      where: { userId: TEMP_USER_ID },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'Vous avez deja un mini-site. Utilisez PATCH pour le modifier.' }, { status: 409 });
    }

    const site = await prisma.miniSite.create({
      data: {
        userId: TEMP_USER_ID,
        slug: slugClean,
        nomEntreprise: body.nomEntreprise,
        metier: body.metier,
        description: body.description || null,
        telephone: body.telephone,
        email: body.email,
        adresse: body.adresse || null,
        zoneIntervention: body.zoneIntervention || null,
        theme: body.theme || 'BLEU',
        certifications: body.certifications || [],
        actif: true,
      },
      include: {
        photos: { orderBy: { ordre: 'asc' } },
        avis: { orderBy: { date: 'desc' } },
      },
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    console.error('POST /api/mini-site error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/mini-site — Modifier le mini-site
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const site = await prisma.miniSite.findFirst({
      where: { userId: TEMP_USER_ID },
    });
    if (!site) {
      return NextResponse.json({ error: 'Mini-site non trouve.' }, { status: 404 });
    }

    // Si slug change, verifier unicite
    if (body.slug && body.slug !== site.slug) {
      const slugClean = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      const dup = await prisma.miniSite.findFirst({
        where: { slug: slugClean, id: { not: site.id } },
      });
      if (dup) {
        return NextResponse.json({ error: 'Ce slug est deja pris.' }, { status: 409 });
      }
      body.slug = slugClean;
    }

    const data: Record<string, unknown> = {};
    const fields = [
      'slug', 'nomEntreprise', 'metier', 'description', 'telephone', 'email',
      'adresse', 'zoneIntervention', 'logoUrl', 'theme', 'certifications', 'actif',
    ];
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f];
    }

    const updated = await prisma.miniSite.update({
      where: { id: site.id },
      data,
      include: {
        photos: { orderBy: { ordre: 'asc' } },
        avis: { where: { valide: true }, orderBy: { date: 'desc' } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/mini-site error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
