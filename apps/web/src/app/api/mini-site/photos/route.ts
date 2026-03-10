import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

// POST /api/mini-site/photos — Ajouter une photo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.url) {
      return NextResponse.json({ error: 'L\'URL de la photo est obligatoire.' }, { status: 400 });
    }

    const site = await prisma.miniSite.findFirst({
      where: { userId: TEMP_USER_ID },
      include: { photos: true },
    });

    if (!site) {
      return NextResponse.json({ error: 'Mini-site non trouve. Creez-le d\'abord.' }, { status: 404 });
    }

    // Max 12 photos
    if (site.photos.length >= 12) {
      return NextResponse.json({ error: 'Maximum 12 photos. Supprimez-en une avant d\'en ajouter.' }, { status: 400 });
    }

    // Ordre = dernier + 1
    const maxOrdre = site.photos.reduce((max, p) => Math.max(max, p.ordre), 0);

    const photo = await prisma.miniSitePhoto.create({
      data: {
        miniSiteId: site.id,
        url: body.url,
        legende: body.legende || null,
        ordre: body.ordre ?? maxOrdre + 1,
        avantApres: body.avantApres ?? false,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error('POST /api/mini-site/photos error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/mini-site/photos — Modifier une photo (legende, ordre, avantApres)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'L\'id de la photo est obligatoire.' }, { status: 400 });
    }

    const photo = await prisma.miniSitePhoto.findUnique({
      where: { id: body.id },
      include: { miniSite: true },
    });

    if (!photo || photo.miniSite.userId !== TEMP_USER_ID) {
      return NextResponse.json({ error: 'Photo non trouvee.' }, { status: 404 });
    }

    const updated = await prisma.miniSitePhoto.update({
      where: { id: body.id },
      data: {
        ...(body.legende !== undefined ? { legende: body.legende } : {}),
        ...(body.ordre !== undefined ? { ordre: body.ordre } : {}),
        ...(body.avantApres !== undefined ? { avantApres: body.avantApres } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/mini-site/photos error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/mini-site/photos — Supprimer une photo
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'L\'id de la photo est obligatoire.' }, { status: 400 });
    }

    const photo = await prisma.miniSitePhoto.findUnique({
      where: { id: body.id },
      include: { miniSite: true },
    });

    if (!photo || photo.miniSite.userId !== TEMP_USER_ID) {
      return NextResponse.json({ error: 'Photo non trouvee.' }, { status: 404 });
    }

    await prisma.miniSitePhoto.delete({
      where: { id: body.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/mini-site/photos error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
