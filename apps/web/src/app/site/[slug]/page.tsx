import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Phone, Mail, MapPin, Shield, Award, Star, ExternalLink, Clock } from 'lucide-react';

const THEME_STYLES: Record<string, { bg: string; accent: string; card: string; btn: string; ring: string }> = {
  BLEU: {
    bg: 'from-blue-50 via-white to-blue-50',
    accent: 'text-blue-600',
    card: 'bg-white/80 border-blue-100 hover:border-blue-300 hover:shadow-blue-100/50',
    btn: 'bg-blue-600 hover:bg-blue-700',
    ring: 'ring-blue-200',
  },
  VERT: {
    bg: 'from-emerald-50 via-white to-emerald-50',
    accent: 'text-emerald-600',
    card: 'bg-white/80 border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-100/50',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    ring: 'ring-emerald-200',
  },
  ORANGE: {
    bg: 'from-orange-50 via-white to-orange-50',
    accent: 'text-orange-600',
    card: 'bg-white/80 border-orange-100 hover:border-orange-300 hover:shadow-orange-100/50',
    btn: 'bg-orange-600 hover:bg-orange-700',
    ring: 'ring-orange-200',
  },
  GRIS: {
    bg: 'from-gray-100 via-white to-gray-100',
    accent: 'text-gray-700',
    card: 'bg-white/80 border-gray-200 hover:border-gray-400 hover:shadow-gray-100/50',
    btn: 'bg-gray-800 hover:bg-gray-900',
    ring: 'ring-gray-200',
  },
};

export default async function MiniSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const site = await prisma.miniSite.findFirst({
    where: { slug, actif: true },
    include: {
      photos: { orderBy: { ordre: 'asc' }, take: 6 },
      avis: { where: { valide: true }, orderBy: { date: 'desc' }, take: 5 },
    },
  });

  if (!site) notFound();

  const theme = THEME_STYLES[site.theme] || THEME_STYLES.BLEU;
  const avgNote = site.avis.length > 0
    ? (site.avis.reduce((s, a) => s + a.note, 0) / site.avis.length).toFixed(1)
    : null;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${theme.bg}`}>
      <div className="max-w-md mx-auto px-4 py-8 space-y-5">

        {/* Avatar + nom */}
        <div className="text-center space-y-3">
          <div className={`w-24 h-24 mx-auto rounded-full ${theme.btn} flex items-center justify-center shadow-lg ring-4 ${theme.ring}`}>
            {site.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.logoUrl} alt={site.nomEntreprise} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white text-3xl font-bold">
                {site.nomEntreprise.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{site.nomEntreprise}</h1>
            <p className={`text-sm font-medium ${theme.accent} mt-0.5`}>{site.metier}</p>
          </div>
          {avgNote && (
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={16}
                  className={n <= Math.round(Number(avgNote)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                />
              ))}
              <span className="text-sm font-medium text-gray-600 ml-1">{avgNote}</span>
              <span className="text-xs text-gray-400">({site.avis.length} avis)</span>
            </div>
          )}
          {site.description && (
            <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">
              {site.description}
            </p>
          )}
        </div>

        {/* Action links — Linktree style */}
        <div className="space-y-3">
          {/* Appeler */}
          <a
            href={`tel:${site.telephone}`}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl border backdrop-blur-sm
                       shadow-sm hover:shadow-md transition-all active:scale-[0.98]
                       ${theme.card}`}
          >
            <div className={`w-10 h-10 rounded-xl ${theme.btn} flex items-center justify-center`}>
              <Phone size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Appeler</p>
              <p className="text-sm text-gray-500">{site.telephone}</p>
            </div>
            <ExternalLink size={16} className="text-gray-400" />
          </a>

          {/* Email */}
          <a
            href={`mailto:${site.email}`}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl border backdrop-blur-sm
                       shadow-sm hover:shadow-md transition-all active:scale-[0.98]
                       ${theme.card}`}
          >
            <div className={`w-10 h-10 rounded-xl ${theme.btn} flex items-center justify-center`}>
              <Mail size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Envoyer un email</p>
              <p className="text-sm text-gray-500">{site.email}</p>
            </div>
            <ExternalLink size={16} className="text-gray-400" />
          </a>

          {/* Demander un devis (SMS) */}
          <a
            href={`sms:${site.telephone}?body=Bonjour, je souhaiterais un devis pour...`}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl border backdrop-blur-sm
                       shadow-sm hover:shadow-md transition-all active:scale-[0.98]
                       ${theme.card}`}
          >
            <div className={`w-10 h-10 rounded-xl ${theme.btn} flex items-center justify-center`}>
              <Clock size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Demander un devis</p>
              <p className="text-sm text-gray-500">Par SMS</p>
            </div>
            <ExternalLink size={16} className="text-gray-400" />
          </a>

          {/* Localisation */}
          {site.adresse && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(site.adresse)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl border backdrop-blur-sm
                         shadow-sm hover:shadow-md transition-all active:scale-[0.98]
                         ${theme.card}`}
            >
              <div className={`w-10 h-10 rounded-xl ${theme.btn} flex items-center justify-center`}>
                <MapPin size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Localisation</p>
                <p className="text-sm text-gray-500">{site.adresse}</p>
              </div>
              <ExternalLink size={16} className="text-gray-400" />
            </a>
          )}
        </div>

        {/* Zone d'intervention */}
        {site.zoneIntervention && (
          <div className={`px-5 py-4 rounded-2xl border backdrop-blur-sm ${theme.card}`}>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Zone d&apos;intervention</p>
            <p className="text-sm text-gray-700">{site.zoneIntervention}</p>
          </div>
        )}

        {/* Certifications */}
        {site.certifications.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold px-1">Certifications & garanties</p>
            <div className="flex flex-wrap gap-2">
              {site.certifications.map((cert, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium ${theme.card}`}
                >
                  {cert.toLowerCase().includes('decennale') || cert.toLowerCase().includes('assurance')
                    ? <Shield size={14} className={theme.accent} />
                    : <Award size={14} className={theme.accent} />
                  }
                  <span className="text-gray-700">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {site.photos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold px-1">Realisations</p>
            <div className="grid grid-cols-2 gap-2">
              {site.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.legende || ''} className="w-full h-full object-cover" />
                  {photo.legende && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs">{photo.legende}</p>
                    </div>
                  )}
                  {photo.avantApres && (
                    <div className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-700">
                      Avant / Apres
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avis */}
        {site.avis.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold px-1">Avis clients</p>
            {site.avis.map((avis) => (
              <div key={avis.id} className={`px-5 py-4 rounded-2xl border backdrop-blur-sm ${theme.card}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={12}
                        className={n <= avis.note ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{avis.auteur}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{avis.commentaire}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(avis.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-gray-400">
            Propulse par <span className="font-semibold">BatiGest</span>
          </p>
        </div>
      </div>
    </div>
  );
}
