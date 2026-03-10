'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Globe, Save, ExternalLink, Eye, Copy, Check, Palette, Wrench, Briefcase, Clock,
  Camera, ImagePlus, Trash2, X, Upload,
} from 'lucide-react';

type MiniSitePhoto = {
  id: string;
  url: string;
  legende: string | null;
  ordre: number;
  avantApres: boolean;
};

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
  logoUrl?: string | null;
  theme?: string;
  certifications?: string[];
  competences?: string[];
  prestations?: string[];
  anneesExperience?: number | null;
  slogan?: string;
  horaires?: string;
  siteWeb?: string;
  actif?: boolean;
  photos?: MiniSitePhoto[];
};

const THEMES = [
  { value: 'BLEU', label: 'Bleu', color: 'bg-blue-500' },
  { value: 'VERT', label: 'Vert', color: 'bg-emerald-500' },
  { value: 'ORANGE', label: 'Orange', color: 'bg-orange-500' },
  { value: 'GRIS', label: 'Gris', color: 'bg-gray-700' },
];

// Redimensionner une image cote client via Canvas
function resizeImage(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas non supporte')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Impossible de charger l\'image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
    reader.readAsDataURL(file);
  });
}

function TagInput({ label, placeholder, tags, onAdd, onRemove, color = 'bg-blue-50 text-blue-700' }: {
  label: string; placeholder: string; tags: string[];
  onAdd: (v: string) => void; onRemove: (v: string) => void; color?: string;
}) {
  const [input, setInput] = useState('');
  function add() {
    if (input.trim() && !tags.includes(input.trim())) {
      onAdd(input.trim());
      setInput('');
    }
  }
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 h-12 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm
                     hover:bg-gray-200 transition-colors min-h-[44px]"
        >
          Ajouter
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${color}`}>
              {tag}
              <button type="button" onClick={() => onRemove(tag)} className="opacity-60 hover:opacity-100">&times;</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MiniSitePage() {
  const [site, setSite] = useState<MiniSiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photos, setPhotos] = useState<MiniSitePhoto[]>([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    slug: '',
    nomEntreprise: '',
    metier: '',
    description: '',
    slogan: '',
    telephone: '',
    email: '',
    adresse: '',
    zoneIntervention: '',
    horaires: '',
    siteWeb: '',
    anneesExperience: '',
    theme: 'BLEU',
    certifications: [] as string[],
    competences: [] as string[],
    prestations: [] as string[],
    actif: true,
    logoUrl: null as string | null,
  });

  const isNew = !site?.id;

  useEffect(() => {
    fetch('/api/mini-site')
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setSite(data);
          setPhotos(data.photos || []);
          setForm({
            slug: data.slug || '',
            nomEntreprise: data.nomEntreprise || '',
            metier: data.metier || '',
            description: data.description || '',
            slogan: data.slogan || '',
            telephone: data.telephone || '',
            email: data.email || '',
            adresse: data.adresse || '',
            zoneIntervention: data.zoneIntervention || '',
            horaires: data.horaires || '',
            siteWeb: data.siteWeb || '',
            anneesExperience: data.anneesExperience ? String(data.anneesExperience) : '',
            theme: data.theme || 'BLEU',
            certifications: data.certifications || [],
            competences: data.competences || [],
            prestations: data.prestations || [],
            actif: data.actif ?? true,
            logoUrl: data.logoUrl || null,
          });
        }
        setLoading(false);
      });
  }, []);

  function generateSlug(nom: string) {
    return nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      anneesExperience: form.anneesExperience ? Number(form.anneesExperience) : null,
      slogan: form.slogan || null,
      horaires: form.horaires || null,
      siteWeb: form.siteWeb || null,
    };

    const method = isNew ? 'POST' : 'PATCH';
    const res = await fetch('/api/mini-site', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      setSite(data);
      setPhotos(data.photos || []);
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

  // Logo upload — redimensionne a 400px et stocke en data URL
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Veuillez selectionner une image (JPG, PNG, WebP).');
      return;
    }
    setUploadingLogo(true);
    try {
      const dataUrl = await resizeImage(file, 400, 0.85);
      setForm({ ...form, logoUrl: dataUrl });
    } catch {
      alert('Erreur lors du traitement de l\'image.');
    }
    setUploadingLogo(false);
    if (logoInputRef.current) logoInputRef.current.value = '';
  }

  // Photos upload — redimensionne a 1200px et envoie a l'API
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (photos.length + files.length > 12) {
      alert(`Maximum 12 photos. Vous pouvez encore en ajouter ${12 - photos.length}.`);
      return;
    }
    setUploadingPhoto(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await resizeImage(file, 1200, 0.8);
        const res = await fetch('/api/mini-site/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: dataUrl }),
        });
        if (res.ok) {
          const photo = await res.json();
          setPhotos((prev) => [...prev, photo]);
        }
      }
    } catch {
      alert('Erreur lors de l\'upload des photos.');
    }
    setUploadingPhoto(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
  }

  async function deletePhoto(photoId: string) {
    if (!confirm('Supprimer cette photo ?')) return;
    const res = await fetch('/api/mini-site/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: photoId }),
    });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    }
  }

  async function toggleAvantApres(photo: MiniSitePhoto) {
    const res = await fetch('/api/mini-site/photos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: photo.id, avantApres: !photo.avantApres }),
    });
    if (res.ok) {
      setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, avantApres: !p.avantApres } : p));
    }
  }

  async function updateLegende(photo: MiniSitePhoto, legende: string) {
    await fetch('/api/mini-site/photos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: photo.id, legende: legende || null }),
    });
    setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, legende: legende || null } : p));
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          {[1, 2, 3, 4].map((i) => (<div key={i} className="h-12 bg-gray-200 rounded-xl" />))}
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
          <p className="text-sm text-gray-500 mt-0.5">Votre portfolio pro, partageable en un lien</p>
        </div>
        {!isNew && form.slug && (
          <a href={`/site/${form.slug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors min-h-[44px]">
            <Eye size={16} /> Voir le site
          </a>
        )}
      </div>

      {/* URL */}
      {!isNew && form.slug && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Lien de votre site</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 font-mono truncate">{siteUrl}</div>
            <button onClick={copyUrl}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors active:scale-95 min-h-[44px]">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copie !' : 'Copier'}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* === IDENTITE + LOGO === */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Globe size={18} className="text-blue-600" /> Identite
          </h2>

          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo / Photo de profil</label>
            <div className="flex items-center gap-4">
              <div className="relative group">
                {form.logoUrl ? (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 relative">
                    <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, logoUrl: null })}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center
                               text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    {uploadingLogo ? (
                      <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={24} />
                    )}
                  </button>
                )}
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium
                             hover:bg-gray-200 transition-colors min-h-[44px] disabled:opacity-50"
                >
                  <Upload size={16} />
                  {form.logoUrl ? 'Changer l\'image' : 'Ajouter un logo'}
                </button>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WebP. Redimensionne a 400px.</p>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom entreprise *</label>
              <input type="text" required value={form.nomEntreprise}
                onChange={(e) => { const nom = e.target.value; setForm({ ...form, nomEntreprise: nom, ...(isNew ? { slug: generateSlug(nom) } : {}) }); }}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metier *</label>
              <input type="text" required value={form.metier} onChange={(e) => setForm({ ...form, metier: e.target.value })}
                placeholder="Ex: Electricien"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">/site/</span>
              <input type="text" required value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                className="flex-1 h-12 px-4 rounded-xl border border-gray-200 bg-white text-base font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slogan / Accroche</label>
            <input type="text" value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })}
              placeholder="Ex: Votre electricien de confiance depuis 2010"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="Presentez votre activite, votre parcours, ce qui vous differencie..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annees d&apos;experience</label>
            <input type="number" min="0" value={form.anneesExperience}
              onChange={(e) => setForm({ ...form, anneesExperience: e.target.value })}
              placeholder="Ex: 15"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        {/* === PHOTOS DE REALISATIONS === */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Camera size={18} className="text-teal-600" /> Photos de realisations
            </h2>
            <span className="text-xs text-gray-400">{photos.length}/12</span>
          </div>

          <p className="text-sm text-gray-500">
            Montrez vos plus beaux chantiers pour convaincre vos futurs clients.
          </p>

          {/* Photos grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-[4/3]">
                  <img src={photo.url} alt={photo.legende || 'Photo'} className="w-full h-full object-cover" />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-start justify-end p-2 opacity-0 group-hover:opacity-100">
                    <button type="button" onClick={() => deletePhoto(photo.id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* Avant/Apres badge */}
                  {photo.avantApres && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded">
                      Avant/Apres
                    </div>
                  )}
                  {/* Legende */}
                  {photo.legende && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs truncate">{photo.legende}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          {photos.length < 12 && (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto || isNew}
              className="w-full flex items-center justify-center gap-3 py-6 rounded-xl border-2 border-dashed border-gray-300
                         text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors
                         disabled:opacity-50 disabled:pointer-events-none min-h-[80px]"
            >
              {uploadingPhoto ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <ImagePlus size={24} />
                  <span className="font-medium">Ajouter des photos</span>
                </>
              )}
            </button>
          )}

          {isNew && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3">
              Creez d&apos;abord votre mini-site pour pouvoir ajouter des photos.
            </p>
          )}

          <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />

          {/* Photo details (legende + avant/apres toggle) */}
          {photos.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Details des photos</p>
              {photos.map((photo, idx) => (
                <div key={photo.id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                  <img src={photo.url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  <input
                    type="text"
                    placeholder={`Legende photo ${idx + 1}...`}
                    defaultValue={photo.legende || ''}
                    onBlur={(e) => updateLegende(photo, e.target.value)}
                    className="flex-1 h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm"
                  />
                  <button type="button" onClick={() => toggleAvantApres(photo)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                      photo.avantApres
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-amber-50'
                    }`}>
                    Avant/Apres
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === COMPETENCES + PRESTATIONS === */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm space-y-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Wrench size={18} className="text-orange-600" /> Competences & prestations
          </h2>

          <TagInput label="Competences" placeholder="Ex: Electricite, Plomberie, Domotique..."
            tags={form.competences}
            onAdd={(v) => setForm({ ...form, competences: [...form.competences, v] })}
            onRemove={(v) => setForm({ ...form, competences: form.competences.filter((c) => c !== v) })}
            color="bg-orange-50 text-orange-700" />

          <TagInput label="Prestations proposees" placeholder="Ex: Renovation complete, Mise aux normes NF C 15-100..."
            tags={form.prestations}
            onAdd={(v) => setForm({ ...form, prestations: [...form.prestations, v] })}
            onRemove={(v) => setForm({ ...form, prestations: form.prestations.filter((c) => c !== v) })}
            color="bg-purple-50 text-purple-700" />

          <TagInput label="Certifications & garanties" placeholder="Ex: Assurance decennale, RGE, Qualibat..."
            tags={form.certifications}
            onAdd={(v) => setForm({ ...form, certifications: [...form.certifications, v] })}
            onRemove={(v) => setForm({ ...form, certifications: form.certifications.filter((c) => c !== v) })}
            color="bg-blue-50 text-blue-700" />
        </div>

        {/* === CONTACT === */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase size={18} className="text-green-600" /> Contact & infos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telephone *</label>
              <input type="tel" required value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input type="text" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              placeholder="Ex: 15 rue Voltaire, 93100 Montreuil"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone d&apos;intervention</label>
            <input type="text" value={form.zoneIntervention} onChange={(e) => setForm({ ...form, zoneIntervention: e.target.value })}
              placeholder="Ex: Paris et petite couronne (92, 93, 94)"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Clock size={14} /> Horaires
              </label>
              <input type="text" value={form.horaires} onChange={(e) => setForm({ ...form, horaires: e.target.value })}
                placeholder="Ex: Lun-Ven 8h-18h"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site web existant</label>
              <input type="text" value={form.siteWeb} onChange={(e) => setForm({ ...form, siteWeb: e.target.value })}
                placeholder="Ex: www.mon-site.fr"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* === THEME === */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Palette size={18} className="text-purple-600" /> Apparence
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEMES.map((t) => (
              <button key={t.value} type="button" onClick={() => setForm({ ...form, theme: t.value })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all min-h-[44px]
                  ${form.theme === t.value ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <div className={`w-8 h-8 rounded-full ${t.color}`} />
                <span className="text-xs font-medium text-gray-700">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actif toggle */}
        {!isNew && (
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Site actif</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {form.actif ? 'Votre site est visible publiquement' : 'Votre site est masque'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.actif}
                  onChange={(e) => setForm({ ...form, actif: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full
                  peer peer-checked:after:translate-x-full peer-checked:bg-blue-600
                  after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                  after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
          </div>
        )}

        <button type="submit"
          disabled={saving || !form.nomEntreprise || !form.slug || !form.telephone || !form.email || !form.metier}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold text-base
            active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none min-h-[56px]">
          <Save size={20} />
          {saving ? 'Enregistrement...' : (isNew ? 'Creer mon mini-site' : 'Enregistrer')}
        </button>

        {!isNew && form.slug && (
          <a href={`/site/${form.slug}`} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-4 rounded-xl font-semibold text-base hover:bg-gray-200 transition-colors min-h-[56px]">
            <ExternalLink size={18} /> Voir mon site
          </a>
        )}
      </form>
    </div>
  );
}
