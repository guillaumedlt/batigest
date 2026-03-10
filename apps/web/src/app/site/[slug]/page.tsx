import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

/* ============================================================
   THEME CONFIG
   ============================================================ */

const THEME_STYLES: Record<string, {
  heroGrad: string; accent: string; accentBg: string; accentBorder: string;
  btn: string; btnHover: string; badge: string; dot: string;
  heroBg: string; ringColor: string;
}> = {
  BLEU: {
    heroGrad: 'from-blue-600 via-blue-700 to-blue-900',
    heroBg: 'bg-blue-600',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    btn: 'bg-blue-600',
    btnHover: 'hover:bg-blue-700',
    badge: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-500',
    ringColor: 'ring-blue-300/40',
  },
  VERT: {
    heroGrad: 'from-emerald-600 via-emerald-700 to-emerald-900',
    heroBg: 'bg-emerald-600',
    accent: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
    btn: 'bg-emerald-600',
    btnHover: 'hover:bg-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
    ringColor: 'ring-emerald-300/40',
  },
  ORANGE: {
    heroGrad: 'from-orange-500 via-orange-600 to-orange-800',
    heroBg: 'bg-orange-500',
    accent: 'text-orange-600',
    accentBg: 'bg-orange-50',
    accentBorder: 'border-orange-200',
    btn: 'bg-orange-600',
    btnHover: 'hover:bg-orange-700',
    badge: 'bg-orange-100 text-orange-800',
    dot: 'bg-orange-500',
    ringColor: 'ring-orange-300/40',
  },
  GRIS: {
    heroGrad: 'from-gray-700 via-gray-800 to-gray-950',
    heroBg: 'bg-gray-700',
    accent: 'text-gray-700',
    accentBg: 'bg-gray-100',
    accentBorder: 'border-gray-300',
    btn: 'bg-gray-800',
    btnHover: 'hover:bg-gray-900',
    badge: 'bg-gray-200 text-gray-800',
    dot: 'bg-gray-600',
    ringColor: 'ring-gray-400/40',
  },
};

/* ============================================================
   INLINE SVG ICONS (no lucide-react dependency)
   ============================================================ */

function IconPhone({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconMail({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconMapPin({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconClock({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconShield({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconGlobe({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconStar({ className = '', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconCheck({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconArrowRight({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function IconBriefcase({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function IconCamera({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function IconWrench({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconAward({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function IconExternalLink({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  );
}

/* ============================================================
   DYNAMIC METADATA (SEO)
   ============================================================ */

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const site = await prisma.miniSite.findFirst({
    where: { slug, actif: true },
    select: { nomEntreprise: true, metier: true, slogan: true, description: true },
  });

  if (!site) {
    return { title: 'Site introuvable' };
  }

  return {
    title: `${site.nomEntreprise} - ${site.metier}`,
    description: site.slogan || site.description || `${site.nomEntreprise}, ${site.metier}`,
  };
}

/* ============================================================
   SECTION LABEL
   ============================================================ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-3">
      {children}
    </p>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function MiniSitePublicPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const site = await prisma.miniSite.findFirst({
    where: { slug, actif: true },
    include: {
      photos: { orderBy: { ordre: 'asc' } },
      avis: { where: { valide: true }, orderBy: { date: 'desc' }, take: 10 },
    },
  });

  if (!site) notFound();

  const t = THEME_STYLES[site.theme] || THEME_STYLES.BLEU;

  const avgNote = site.avis.length > 0
    ? (site.avis.reduce((sum, a) => sum + a.note, 0) / site.avis.length).toFixed(1)
    : null;

  const hasContact = site.telephone || site.email || site.adresse || site.zoneIntervention || site.horaires;

  return (
    <div className="min-h-screen bg-gray-50 antialiased">

      {/* ======================================================
          HERO
          ====================================================== */}
      <header className={`relative bg-gradient-to-br ${t.heroGrad} text-white overflow-hidden`}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
        />

        <div className="relative max-w-lg mx-auto px-5 pt-12 pb-20 text-center">
          {/* Logo / Avatar */}
          <div className={`w-28 h-28 mx-auto rounded-full bg-white/15 backdrop-blur-sm
                          flex items-center justify-center ring-4 ${t.ringColor}
                          shadow-2xl mb-6`}>
            {site.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.logoUrl} alt={site.nomEntreprise}
                className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white text-5xl font-bold drop-shadow-sm select-none">
                {site.nomEntreprise.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {site.nomEntreprise}
          </h1>
          <p className="text-white/75 font-medium mt-1.5 text-lg">{site.metier}</p>

          {site.slogan && (
            <p className="text-white/50 text-sm mt-3 italic max-w-xs mx-auto leading-relaxed">
              &laquo;&nbsp;{site.slogan}&nbsp;&raquo;
            </p>
          )}

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 mt-7">
            {site.anneesExperience != null && site.anneesExperience > 0 && (
              <div className="text-center">
                <p className="text-3xl font-bold">{site.anneesExperience}</p>
                <p className="text-white/50 text-[10px] uppercase tracking-widest mt-0.5">ans exp.</p>
              </div>
            )}
            {avgNote && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <IconStar className="text-yellow-400" filled />
                  <span className="text-3xl font-bold">{avgNote}</span>
                </div>
                <p className="text-white/50 text-[10px] uppercase tracking-widest mt-0.5">
                  {site.avis.length} avis
                </p>
              </div>
            )}
            {site.certifications.length > 0 && (
              <div className="text-center">
                <p className="text-3xl font-bold">{site.certifications.length}</p>
                <p className="text-white/50 text-[10px] uppercase tracking-widest mt-0.5">certif.</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================
          MAIN CONTENT
          ====================================================== */}
      <main className="max-w-lg mx-auto px-5 -mt-10 space-y-5 pb-6">

        {/* ===== CTA: Appeler + Email ===== */}
        <div className="grid grid-cols-2 gap-3">
          {site.telephone && (
            <a href={`tel:${site.telephone}`}
              className={`flex items-center justify-center gap-2 ${t.btn} ${t.btnHover}
                         text-white px-4 py-4 rounded-2xl font-semibold text-sm shadow-lg
                         active:scale-[0.97] transition-all`}>
              <IconPhone />
              Appeler
            </a>
          )}
          {site.email && (
            <a href={`mailto:${site.email}`}
              className="flex items-center justify-center gap-2 bg-white text-gray-800
                         px-4 py-4 rounded-2xl font-semibold text-sm shadow-lg border border-gray-100
                         active:scale-[0.97] transition-all">
              <IconMail />
              Email
            </a>
          )}
        </div>

        {/* ===== CTA: Demander un devis ===== */}
        <a href={site.telephone ? `tel:${site.telephone}` : `mailto:${site.email}`}
          className={`flex items-center justify-center gap-2.5 ${t.btn} ${t.btnHover}
                     text-white px-5 py-4 rounded-2xl font-bold text-base shadow-lg
                     active:scale-[0.97] transition-all w-full`}>
          <IconBriefcase className="shrink-0" />
          Demander un devis gratuit
          <IconArrowRight className="shrink-0" />
        </a>

        {/* ===== A PROPOS / DESCRIPTION ===== */}
        {site.description && (
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <SectionLabel>A propos</SectionLabel>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {site.description}
            </p>
          </section>
        )}

        {/* ===== EXPERIENCE ===== */}
        {site.anneesExperience != null && site.anneesExperience > 0 && (
          <section className={`rounded-2xl p-5 shadow-sm border ${t.accentBg} ${t.accentBorder}`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${t.btn} flex items-center justify-center text-white shrink-0`}>
                <span className="text-2xl font-bold">{site.anneesExperience}</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">
                  {site.anneesExperience} an{site.anneesExperience > 1 ? 's' : ''} d&apos;experience
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Un savoir-faire eprouve au service de vos projets
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ===== COMPETENCES ===== */}
        {site.competences.length > 0 && (
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2.5 mb-4">
              <IconWrench className={t.accent} />
              <h2 className="font-bold text-gray-900">Competences</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {site.competences.map((comp, i) => (
                <span key={i} className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${t.badge}`}>
                  {comp}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ===== CERTIFICATIONS & GARANTIES ===== */}
        {site.certifications.length > 0 && (
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2.5 mb-4">
              <IconShield className={t.accent} />
              <h2 className="font-bold text-gray-900">Certifications & garanties</h2>
            </div>
            <div className="space-y-2">
              {site.certifications.map((cert, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${t.accentBg}`}>
                  {cert.toLowerCase().includes('decennale') || cert.toLowerCase().includes('assurance')
                    ? <IconShield className={`${t.accent} shrink-0`} />
                    : <IconAward className={`${t.accent} shrink-0`} />
                  }
                  <span className="text-sm font-medium text-gray-800">{cert}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== PRESTATIONS ===== */}
        {site.prestations.length > 0 && (
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2.5 mb-4">
              <IconBriefcase className={t.accent} />
              <h2 className="font-bold text-gray-900">Nos prestations</h2>
            </div>
            <div className="space-y-1">
              {site.prestations.map((prest, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <IconCheck className={`${t.accent} shrink-0`} />
                  <span className="text-sm text-gray-700 font-medium">{prest}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== PHOTOS / REALISATIONS ===== */}
        {site.photos.length > 0 && (
          <section>
            <div className="flex items-center gap-2.5 mb-4 px-1">
              <IconCamera className={t.accent} />
              <h2 className="font-bold text-gray-900">Nos realisations</h2>
              <span className="ml-auto text-xs text-gray-400 font-medium">
                {site.photos.length} photo{site.photos.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {site.photos.map((photo) => (
                <div key={photo.id}
                  className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm group bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.legende || 'Realisation'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Avant/Apres badge */}
                  {photo.avantApres && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white px-2.5 py-0.5 rounded-full
                                    text-[10px] font-bold tracking-wide shadow-sm">
                      Avant / Apres
                    </div>
                  )}
                  {/* Caption overlay */}
                  {photo.legende && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
                      <p className="text-white text-xs font-medium leading-snug">{photo.legende}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== AVIS CLIENTS ===== */}
        {site.avis.length > 0 && (
          <section>
            <div className="flex items-center gap-2.5 mb-4 px-1">
              <IconStar className={`${t.accent} w-5 h-5`} filled />
              <h2 className="font-bold text-gray-900">Avis clients</h2>
              {avgNote && (
                <span className={`ml-auto text-sm font-bold ${t.accent}`}>{avgNote}/5</span>
              )}
            </div>
            <div className="space-y-3">
              {site.avis.map((avis) => (
                <div key={avis.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full ${t.btn} flex items-center justify-center`}>
                        <span className="text-white text-xs font-bold">
                          {avis.auteur.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{avis.auteur}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <IconStar
                          key={n}
                          className={n <= avis.note ? 'text-yellow-400' : 'text-gray-200'}
                          filled={n <= avis.note}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{avis.commentaire}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(avis.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== CONTACT & INFOS PRATIQUES ===== */}
        {hasContact && (
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
            <SectionLabel>Infos pratiques</SectionLabel>

            {site.telephone && (
              <a href={`tel:${site.telephone}`} className="flex items-center gap-3 group py-1">
                <div className={`w-10 h-10 rounded-xl ${t.accentBg} flex items-center justify-center shrink-0`}>
                  <IconPhone className={t.accent} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Telephone</p>
                  <p className="text-sm text-gray-800 font-semibold group-hover:underline">{site.telephone}</p>
                </div>
              </a>
            )}

            {site.email && (
              <a href={`mailto:${site.email}`} className="flex items-center gap-3 group py-1">
                <div className={`w-10 h-10 rounded-xl ${t.accentBg} flex items-center justify-center shrink-0`}>
                  <IconMail className={t.accent} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Email</p>
                  <p className="text-sm text-gray-800 font-semibold group-hover:underline truncate">{site.email}</p>
                </div>
              </a>
            )}

            {site.adresse && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(site.adresse)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 group py-1">
                <div className={`w-10 h-10 rounded-xl ${t.accentBg} flex items-center justify-center shrink-0`}>
                  <IconMapPin className={t.accent} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Adresse</p>
                  <p className="text-sm text-gray-800 font-semibold group-hover:underline">{site.adresse}</p>
                </div>
                <IconExternalLink className="text-gray-300 shrink-0" />
              </a>
            )}

            {site.zoneIntervention && (
              <div className="flex items-center gap-3 py-1">
                <div className={`w-10 h-10 rounded-xl ${t.accentBg} flex items-center justify-center shrink-0`}>
                  <IconGlobe className={t.accent} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Zone d&apos;intervention</p>
                  <p className="text-sm text-gray-800 font-semibold">{site.zoneIntervention}</p>
                </div>
              </div>
            )}

            {site.horaires && (
              <div className="flex items-center gap-3 py-1">
                <div className={`w-10 h-10 rounded-xl ${t.accentBg} flex items-center justify-center shrink-0`}>
                  <IconClock className={t.accent} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Horaires</p>
                  <p className="text-sm text-gray-800 font-semibold">{site.horaires}</p>
                </div>
              </div>
            )}

            {site.siteWeb && (
              <a href={site.siteWeb.startsWith('http') ? site.siteWeb : `https://${site.siteWeb}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 group py-1">
                <div className={`w-10 h-10 rounded-xl ${t.accentBg} flex items-center justify-center shrink-0`}>
                  <IconGlobe className={t.accent} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Site web</p>
                  <p className="text-sm text-gray-800 font-semibold group-hover:underline truncate">{site.siteWeb}</p>
                </div>
                <IconExternalLink className="text-gray-300 shrink-0" />
              </a>
            )}
          </section>
        )}

        {/* ===== BOTTOM CTA ===== */}
        <a href={site.telephone ? `tel:${site.telephone}` : `mailto:${site.email}`}
          className={`flex items-center justify-center gap-2.5 ${t.btn} ${t.btnHover}
                     text-white px-5 py-4 rounded-2xl font-bold text-base shadow-lg
                     active:scale-[0.97] transition-all w-full`}>
          <IconPhone />
          Demander un devis
          <IconArrowRight />
        </a>

        {/* ===== FOOTER ===== */}
        <footer className="text-center pt-4 pb-8">
          <p className="text-xs text-gray-400">
            Site cree avec{' '}
            <span className="font-semibold text-gray-500">BatiGest</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
