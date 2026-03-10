import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/site/[slug] — Public: retourne le mini-site par slug (actif uniquement)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug manquant.' }, { status: 400 });
    }

    const site = await prisma.miniSite.findFirst({
      where: { slug, actif: true },
      include: {
        photos: { orderBy: { ordre: 'asc' } },
        avis: { where: { valide: true }, orderBy: { date: 'desc' }, take: 10 },
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site introuvable ou desactive.' },
        { status: 404 },
      );
    }

    // Retourner les donnees publiques (exclure userId et autres champs internes)
    return NextResponse.json({
      id: site.id,
      slug: site.slug,
      nomEntreprise: site.nomEntreprise,
      metier: site.metier,
      description: site.description,
      telephone: site.telephone,
      email: site.email,
      adresse: site.adresse,
      zoneIntervention: site.zoneIntervention,
      logoUrl: site.logoUrl,
      theme: site.theme,
      certifications: site.certifications,
      competences: site.competences,
      prestations: site.prestations,
      anneesExperience: site.anneesExperience,
      slogan: site.slogan,
      horaires: site.horaires,
      siteWeb: site.siteWeb,
      photos: site.photos.map((p) => ({
        id: p.id,
        url: p.url,
        legende: p.legende,
        ordre: p.ordre,
        avantApres: p.avantApres,
      })),
      avis: site.avis.map((a) => ({
        id: a.id,
        auteur: a.auteur,
        note: a.note,
        commentaire: a.commentaire,
        date: a.date,
      })),
    });
  } catch (error) {
    console.error('GET /api/site/[slug] error:', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
