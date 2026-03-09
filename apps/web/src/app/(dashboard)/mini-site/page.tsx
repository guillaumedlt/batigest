'use client';

import { useState, useEffect } from 'react';
import { Globe, Save, ExternalLink, Eye, Copy, Check, Palette } from 'lucide-react';

type MiniSiteData = {
  id?: string;
  exists?: boolean;
  slug?: string;
  nomEntreprise?: string;
  metier?: string;
  description?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  zoneIntervention?: string;
  theme?: string;
  certifications?: string[];
  actif?: boolean;
};

const THEMES = [
  { value: 'BLEU', label: 'Bleu', color: 'bg-blue-500' },
  { value: 'VERT', label: 'Vert', color: 'bg-emerald-500' },
  { value: 'ORANGE', label: 'Orange', color: 'bg-orange-500' },
  { value: 'GRIS', label: 'Gris', color: 'bg-gray-700' },
];

export default function MiniSitePage() {
  const [site, setSite] = useState<MiniSiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [certInput, setCertInput] = useState('');

  const [form, setForm] = useState({
    slug: '',
    nomEntreprise: '',
    metier: '',
    description: '',
    telephone: '',
    email: '',
    adresse: '',
    zoneIntervention: '',
    theme: 'BLEU',
    certifications: [] as string[],
    actif: true,
  });

  const isNew = !site?.id;

  useEffect(() => {
    fetch('/api/mini-site')
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setSite(data);
          setForm({
            slug: data.slug || '',
            nomEntreprise: data.nomEntreprise || '',
            metier: data.metier || '',
            description: data.description || '',
            telephone: data.telephone || '',
            email: data.email || '',
            adresse: data.adresse || '',
            zoneIntervention: data.zoneIntervention || '',
            theme: data.theme || 'BLEU',
            certifications: data.certifications || [],
            actif: data.actif ?? true,
          });
        }
        setLoading(false);
      });
  }, []);

  // Auto-generer le slug depuis le nom
  function generateSlug(nom: string) {
    return nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function addCert() {
    if (certInput.trim() && !form.certifications.includes(certInput.trim())) {
      setForm({ ...form, certifications: [...form.certifications, certInput.trim()] });
      setCertInput('');
    }
  }

  function removeCert(cert: string) {
    setForm({ ...form, certifications: form.certifications.filter((c) => c !== cert) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const method = isNew ? 'POST' : 'PATCH';
    const res = await fetch('/api/mini-site', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const data = await res.json();
      setSite(data);
      alert(isNew ? 'Mini-site cree avec succes !' : 'Modifications enregistrees !');
    } else {
      const err = await res.json();
      alert(err.error || 'Erreur lors de l\'enregistrement.');
    }
    setSaving(false);
  }

  function copyUrl() {
    const url = `${window.location.origin}/site/${form.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const siteUrl = form.slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/site/${form.slug}` : '';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mini-site vitrine</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Votre page pro style Linktree, partageable en un lien
          </p>
        </div>
        {!isNew && form.slug && (
          <a
            href={`/site/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl
                       font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            <Eye size={16} />
            Voir le site
          </a>
        )}
      </div>

      {/* URL du site */}
      {!isNew && form.slug && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Lien de votre site</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 font-mono truncate">
              {siteUrl}
            </div>
            <button
              onClick={copyUrl}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium
                         hover:bg-blue-700 transition-colors active:scale-95"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copie !' : 'Copier'}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identite */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Globe size={18} className="text-blue-600" />
            Identite
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom entreprise *</label>
              <input
                type="text"
                required
                value={form.nomEntreprise}
                onChange={(e) => {
                  const nom = e.target.value;
                  setForm({
                    ...form,
                    nomEntreprise: nom,
                    ...(isNew ? { slug: generateSlug(nom) } : {}),
                  });
                }}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metier *</label>
              <input
                type="text"
                required
                value={form.metier}
                onChange={(e) => setForm({ ...form, metier: e.target.value })}
                placeholder="Ex: Electricien"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">/site/</span>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                className="flex-1 h-12 px-4 rounded-xl border border-gray-200 bg-white text-base font-mono
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Presentez votre activite en quelques mots..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telephone *</label>
              <input
                type="tel"
                required
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input
              type="text"
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              placeholder="Ex: 12 rue des Lilas, 75020 Paris"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone d&apos;intervention</label>
            <input
              type="text"
              value={form.zoneIntervention}
              onChange={(e) => setForm({ ...form, zoneIntervention: e.target.value })}
              placeholder="Ex: Paris et petite couronne (92, 93, 94)"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Palette size={18} className="text-purple-600" />
            Apparence
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, theme: t.value })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                           ${form.theme === t.value ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className={`w-8 h-8 rounded-full ${t.color}`} />
                <span className="text-xs font-medium text-gray-700">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Certifications & garanties</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
              placeholder="Ex: Assurance decennale, RGE, Qualibat..."
              className="flex-1 h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={addCert}
              className="px-4 h-12 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm
                         hover:bg-gray-200 transition-colors"
            >
              Ajouter
            </button>
          </div>
          {form.certifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.certifications.map((cert) => (
                <span
                  key={cert}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium"
                >
                  {cert}
                  <button
                    type="button"
                    onClick={() => removeCert(cert)}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actif toggle */}
        {!isNew && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Site actif</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {form.actif ? 'Votre site est visible publiquement' : 'Votre site est masque'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full
                                peer peer-checked:after:translate-x-full peer-checked:bg-blue-600
                                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !form.nomEntreprise || !form.slug || !form.telephone || !form.email || !form.metier}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white
                     px-6 py-4 rounded-xl font-semibold text-base
                     active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none"
        >
          <Save size={20} />
          {saving ? 'Enregistrement...' : (isNew ? 'Creer mon mini-site' : 'Enregistrer')}
        </button>

        {!isNew && form.slug && (
          <a
            href={`/site/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700
                       px-6 py-4 rounded-xl font-semibold text-base hover:bg-gray-200 transition-colors"
          >
            <ExternalLink size={18} />
            Voir mon site
          </a>
        )}
      </form>
    </div>
  );
}
