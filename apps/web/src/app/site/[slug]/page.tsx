import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import {
  Phone, Mail, MapPin, Shield, Award, Star, ExternalLink,
  Clock, Wrench, Briefcase, Calendar, Globe, ChevronRight,
} from 'lucide-react';

const THEME_STYLES: Record<string, {
  bg: string; accent: string; accentBg: string; card: string;
  btn: string; btnText: string; hero: string; ring: string; badge: string;
}> = {
  BLEU: {
    bg: 'from-blue-600 via-blue-500 to-blue-700',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-50',
    card: 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-lg',
    btn: 'bg-blue-600 hover:bg-blue-700',
    btnText: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
    hero: 'from-blue-600 to-blue-800',
    ring: 'ring-white/30',
    badge: 'bg-blue-100 text-blue-700',
  },
  VERT: {
    bg: 'from-emerald-600 via-emerald-500 to-emerald-700',
    accent: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    card: 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-lg',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    btnText: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100',
    hero: 'from-emerald-600 to-emerald-800',
    ring: 'ring-white/30',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  ORANGE: {
    bg: 'from-orange-500 via-orange-400 to-orange-600',
    accent: 'text-orange-600',
    accentBg: 'bg-orange-50',
    card: 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-lg',
    btn: 'bg-orange-600 hover:bg-orange-700',
    btnText: 'text-orange-600 bg-orange-50 hover:bg-orange-100',
    hero: 'from-orange-500 to-orange-700',
    ring: 'ring-white/30',
    badge: 'bg-orange-100 text-orange-700',
  },
  GRIS: {
    bg: 'from-gray-700 via-gray-600 to-gray-800',
    accent: 'text-gray-700',
    accentBg: 'bg-gray-50',
    card: 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-lg',
    btn: 'bg-gray-800 hover:bg-gray-900',
    btnText: 'text-gray-700 bg-gray-100 hover:bg-gray-200',
    hero: 'from-gray-700 to-gray-900',
    ring: 'ring-white/30',
    badge: 'bg-gray-200 text-gray-700',
  },
};

export default async function MiniSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const site = await prisma.miniSite.findFirst({
    where: { slug, actif: true },
    include: {
      photos: { orderBy: { ordre: 'asc' }, take: 8 },
      avis: { where: { valide: true }, orderBy: { date: 'desc' }, take: 6 },
    },
  });

  if (!site) notFound();

  const theme = THEME_STYLES[site.theme] || THEME_STYLES.BLEU;
  const avgNote = site.avis.length > 0
    ? (site.avis.reduce((s, a) => s + a.note, 0) / site.avis.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== HERO ===== */}
      <div className={`bg-gradient-to-br ${theme.hero} text-white`}>
        <div className="max-w-lg mx-auto px-5 pt-10 pb-16 text-center">
          {/* Avatar */}
          <div className={`w-28 h-28 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center
                          ring-4 ${theme.ring} shadow-2xl mb-5`}>
            {site.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.logoUrl} alt={site.nomEntreprise} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white text-4xl font-bold drop-shadow-sm">
                {site.nomEntreprise.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight">{site.nomEntreprise}</h1>
          <p className="text-white/80 font-medium mt-1 text-lg">{site.metier}</p>

          {site.slogan && (
            <p className="text-white/60 text-sm mt-2 italic">&laquo; {site.slogan} &raquo;</p>
          )}

          {/* Stats rapides */}
          <div className="flex items-center justify-center gap-6 mt-6">
            {site.anneesExperience && (
              <div className="text-center">
                <p className="text-2xl font-bold">{site.anneesExperience}</p>
                <p className="text-white/60 text-xs uppercase tracking-wider">ans exp.</p>
              </div>
            )}
            {avgNote && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star size={18} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-2xl font-bold">{avgNote}</span>
                </div>
                <p className="text-white/60 text-xs uppercase tracking-wider">{site.avis.length} avis</p>
              </div>
            )}
            {site.certifications.length > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold">{site.certifications.length}</p>
                <p className="text-white/60 text-xs uppercase tracking-wider">certif.</p>
              </div>
            )}
          </div>

          {site.description && (
            <p className="text-white/70 text-sm leading-relaxed mt-5 max-w-sm mx-auto">
              {site.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 -mt-8 space-y-5 pb-10">

        {/* ===== CTA BUTTONS ===== */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`tel:${site.telephone}`}
            className={`flex items-center justify-center gap-2 ${theme.btn} text-white
                       px-4 py-4 rounded-2xl font-semibold text-sm shadow-lg
                       active:scale-[0.97] transition-all`}
          >
            <Phone size={18} />
            Appeler
          </a>
          <a
            href={`mailto:${site.email}`}
            className="flex items-center justify-center gap-2 bg-white text-gray-800
                       px-4 py-4 rounded-2xl font-semibold text-sm shadow-lg border border-gray-100
                       active:scale-[0.97] transition-all"
          >
            <Mail size={18} />
            Email
          </a>
        </div>

        {/* Demander un devis — full width */}
        <a
          href={`sms:${site.telephone}?body=Bonjour, je souhaiterais un devis pour...`}
          className={`flex items-center justify-center gap-2 ${theme.btnText}
                     px-5 py-4 rounded-2xl font-semibold text-sm border border-current/10
                     active:scale-[0.97] transition-all w-full`}
        >
          <Briefcase size={18} />
          Demander un devis gratuit
          <ChevronRight size={16} />
        </a>

        {/* ===== COMPETENCES ===== */}
        {site.competences.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Wrench size={18} className={theme.accent} />
              <h2 className="font-bold text-gray-900">Competences</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {site.competences.map((comp, i) => (
                <span
                  key={i}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium ${theme.badge}`}
                >
                  {comp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ===== PRESTATIONS ===== */}
        {site.prestations.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase size={18} className={theme.accent} />
              <h2 className="font-bold text-gray-900">Prestations</h2>
            </div>
            <div className="space-y-2">
              {site.prestations.map((prest, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-2 h-2 rounded-full ${theme.btn}`} />
                  <span className="text-sm text-gray-700 font-medium">{prest}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== CERTIFICATIONS ===== */}
        {site.certifications.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className={theme.accent} />
              <h2 className="font-bold text-gray-900">Certifications & garanties</h2>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {site.certifications.map((cert, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${theme.accentBg}`}>
                  {cert.toLowerCase().includes('decennale') || cert.toLowerCase().includes('assurance')
                    ? <Shield size={16} className={theme.accent} />
                    : <Award size={16} className={theme.accent} />
                  }
                  <span className="text-sm font-medium text-gray-800">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== PHOTOS / PORTFOLIO ===== */}
        {site.photos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Calendar size={18} className={theme.accent} />
              <h2 className="font-bold text-gray-900">Realisations</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {site.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.legende || 'Realisation'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {photo.legende && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-white text-xs font-medium">{photo.legende}</p>
                    </div>
                  )}
                  {photo.avantApres && (
                    <div className="absolute top-2 left-2 bg-white/90 px-2.5 py-1 rounded-full text-[10px] font-bold text-gray-700 shadow-sm">
                      Avant / Apres
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== AVIS CLIENTS ===== */}
        {site.avis.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Star size={18} className={theme.accent} />
              <h2 className="font-bold text-gray-900">Avis clients</h2>
              {avgNote && (
                <span className={`ml-auto text-sm font-bold ${theme.accent}`}>{avgNote}/5</span>
              )}
            </div>
            <div className="space-y-3">
              {site.avis.map((avis) => (
                <div key={avis.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${theme.btn} flex items-center justify-center`}>
                        <span className="text-white text-xs font-bold">{avis.auteur.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{avis.auteur}</span>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={12}
                          className={n <= avis.note ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
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
          </div>
        )}

        {/* ===== INFOS PRATIQUES ===== */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-bold text-gray-900">Infos pratiques</h2>

          {site.adresse && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(site.adresse)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              <div className={`w-10 h-10 rounded-xl ${theme.accentBg} flex items-center justify-center`}>
                <MapPin size={18} className={theme.accent} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Adresse</p>
                <p className="text-sm text-gray-800 font-medium group-hover:underline">{site.adresse}</p>
              </div>
              <ExternalLink size={14} className="text-gray-300" />
            </a>
          )}

          {site.zoneIntervention && (
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${theme.accentBg} flex items-center justify-center`}>
                <Globe size={18} className={theme.accent} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Zone d&apos;intervention</p>
                <p className="text-sm text-gray-800 font-medium">{site.zoneIntervention}</p>
              </div>
            </div>
          )}

          {site.horaires && (
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${theme.accentBg} flex items-center justify-center`}>
                <Clock size={18} className={theme.accent} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Horaires</p>
                <p className="text-sm text-gray-800 font-medium">{site.horaires}</p>
              </div>
            </div>
          )}

          {site.siteWeb && (
            <a
              href={site.siteWeb.startsWith('http') ? site.siteWeb : `https://${site.siteWeb}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              <div className={`w-10 h-10 rounded-xl ${theme.accentBg} flex items-center justify-center`}>
                <Globe size={18} className={theme.accent} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Site web</p>
                <p className="text-sm text-gray-800 font-medium group-hover:underline">{site.siteWeb}</p>
              </div>
              <ExternalLink size={14} className="text-gray-300" />
            </a>
          )}
        </div>

        {/* ===== FOOTER ===== */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-gray-400">
            Propulse par <span className="font-semibold">BatiGest</span>
          </p>
        </div>
      </div>
    </div>
  );
}
