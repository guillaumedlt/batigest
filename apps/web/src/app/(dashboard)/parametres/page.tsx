'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, Building2, FileText, Shield, Hash, Palette, Upload, X } from 'lucide-react';

type Entreprise = {
  id: string;
  nomEntreprise: string;
  formeJuridique: string | null;
  siret: string | null;
  rcsRm: string | null;
  tvaIntracom: string | null;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
  metier: string | null;
  assuranceDecennale: string | null;
  assuranceNumero: string | null;
  assuranceZone: string | null;
  franchiseTVA: boolean;
  regimeTVA: string;
  conditionsReglement: string | null;
  mentionsDevis: string | null;
  mentionsFacture: string | null;
  rib: string | null;
  logoUrl: string | null;
  docCouleur: string;
  docPolice: string;
  prefixDevis: string;
  prefixFacture: string;
  prefixAvoir: string;
  sequenceDevis: number;
  sequenceFacture: number;
  sequenceAvoir: number;
};

const FORMES_JURIDIQUES = [
  { value: '', label: 'Choisir...' },
  { value: 'EI', label: 'Entreprise individuelle (EI)' },
  { value: 'MICRO', label: 'Micro-entreprise / Auto-entrepreneur' },
  { value: 'EURL', label: 'EURL' },
  { value: 'SARL', label: 'SARL' },
  { value: 'SAS', label: 'SAS' },
  { value: 'SASU', label: 'SASU' },
];

const REGIMES_TVA = [
  {
    value: 'FRANCHISE',
    label: 'Franchise en base (pas de TVA)',
    description: 'Micro-entreprise ou CA < seuils (37 500 EUR services / 85 000 EUR ventes). Mention obligatoire sur factures : "TVA non applicable, art. 293 B du CGI"',
  },
  {
    value: 'REEL_SIMPLIFIE',
    label: 'Reel simplifie',
    description: 'Declaration annuelle CA12 + 2 acomptes semestriels. CA entre 37 500 et 286 000 EUR (services) et TVA < 15 000 EUR/an. Supprime en 2027.',
  },
  {
    value: 'REEL_NORMAL',
    label: 'Reel normal',
    description: 'Declaration mensuelle CA3. Obligatoire au-dela de 286 000 EUR (services) ou 945 000 EUR (ventes), ou TVA > 15 000 EUR/an.',
  },
];

const COULEURS_PRESETS = [
  { value: '#2563EB', label: 'Bleu' },
  { value: '#059669', label: 'Vert' },
  { value: '#DC2626', label: 'Rouge' },
  { value: '#D97706', label: 'Orange' },
  { value: '#7C3AED', label: 'Violet' },
  { value: '#0891B2', label: 'Cyan' },
  { value: '#4B5563', label: 'Gris' },
  { value: '#000000', label: 'Noir' },
];

const POLICES = [
  { value: 'Inter', label: 'Inter (moderne)' },
  { value: 'Arial, sans-serif', label: 'Arial (classique)' },
  { value: 'Georgia, serif', label: 'Georgia (elegant)' },
  { value: 'Courier New, monospace', label: 'Courier (technique)' },
  { value: 'Verdana, sans-serif', label: 'Verdana (lisible)' },
  { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet (dynamique)' },
];

export default function ParametresPage() {
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/entreprise')
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setEntreprise(data);
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    if (!entreprise) return;
    setSaving(true);
    setSaved(false);

    const res = await fetch('/api/entreprise', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entreprise),
    });

    if (res.ok) {
      const updated = await res.json();
      setEntreprise(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const err = await res.json();
      alert(err.error || 'Erreur lors de la sauvegarde.');
    }
    setSaving(false);
  }

  function updateField(field: string, value: string | boolean | number) {
    if (!entreprise) return;
    // Convertir en nombre pour les champs sequence
    if (field.startsWith('sequence') && typeof value === 'string') {
      const num = parseInt(value, 10);
      setEntreprise({ ...entreprise, [field]: isNaN(num) ? 0 : num });
      return;
    }
    setEntreprise({ ...entreprise, [field]: value });
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !entreprise) return;
    if (file.size > 500_000) {
      alert('Le logo ne doit pas depasser 500 Ko.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEntreprise({ ...entreprise, logoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-12 bg-gray-200 rounded-xl" />
            <div className="h-12 bg-gray-200 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!entreprise) {
    return (
      <div className="text-center py-12">
        <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-lg font-medium text-gray-500">Entreprise non configuree</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Parametres</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
                     active:scale-95 transition-all min-h-[44px] ${
                       saved
                         ? 'bg-green-600 text-white'
                         : 'bg-blue-600 text-white'
                     }`}
        >
          <Save size={18} />
          {saving ? 'Sauvegarde...' : saved ? 'Sauvegarde !' : 'Sauvegarder'}
        </button>
      </div>

      {/* Identite */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 size={20} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Identite de l&apos;entreprise</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;entreprise</label>
            <input
              type="text"
              value={entreprise.nomEntreprise}
              onChange={(e) => updateField('nomEntreprise', e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forme juridique</label>
            <select
              value={entreprise.formeJuridique || ''}
              onChange={(e) => updateField('formeJuridique', e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {FORMES_JURIDIQUES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
            <input
              type="text"
              value={entreprise.siret || ''}
              onChange={(e) => updateField('siret', e.target.value)}
              placeholder="123 456 789 00012"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metier</label>
            <input
              type="text"
              value={entreprise.metier || ''}
              onChange={(e) => updateField('metier', e.target.value)}
              placeholder="Electricien, Plombier, Macon..."
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input
            type="text"
            value={entreprise.adresse}
            onChange={(e) => updateField('adresse', e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
            <input
              type="text"
              value={entreprise.codePostal}
              onChange={(e) => updateField('codePostal', e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <input
              type="text"
              value={entreprise.ville}
              onChange={(e) => updateField('ville', e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
            <input
              type="tel"
              value={entreprise.telephone}
              onChange={(e) => updateField('telephone', e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={entreprise.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Regime TVA */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={20} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Regime TVA</h2>
        </div>

        <div className="space-y-3">
          {REGIMES_TVA.map((regime) => (
            <label
              key={regime.value}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                entreprise.regimeTVA === regime.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="regimeTVA"
                value={regime.value}
                checked={entreprise.regimeTVA === regime.value}
                onChange={(e) => updateField('regimeTVA', e.target.value)}
                className="mt-1 accent-blue-600"
              />
              <div>
                <p className="font-medium text-gray-900">{regime.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{regime.description}</p>
              </div>
            </label>
          ))}
        </div>

        {entreprise.regimeTVA !== 'FRANCHISE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° TVA intracommunautaire</label>
            <input
              type="text"
              value={entreprise.tvaIntracom || ''}
              onChange={(e) => updateField('tvaIntracom', e.target.value)}
              placeholder="FR XX 123456789"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Assurance decennale */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={20} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Assurance decennale</h2>
        </div>
        <p className="text-sm text-gray-500">Obligatoire pour les artisans du batiment. Ces informations apparaitront sur vos devis et factures.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;assureur</label>
            <input
              type="text"
              value={entreprise.assuranceDecennale || ''}
              onChange={(e) => updateField('assuranceDecennale', e.target.value)}
              placeholder="Ex: AXA, MAAF, SMABTP..."
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° de police</label>
            <input
              type="text"
              value={entreprise.assuranceNumero || ''}
              onChange={(e) => updateField('assuranceNumero', e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zone de couverture</label>
          <input
            type="text"
            value={entreprise.assuranceZone || ''}
            onChange={(e) => updateField('assuranceZone', e.target.value)}
            placeholder="Ex: France metropolitaine"
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Coordonnees bancaires */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={20} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Coordonnees bancaires</h2>
        </div>
        <p className="text-sm text-gray-500">Votre IBAN apparaitra en bas de vos factures pour faciliter le paiement.</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
          <input
            type="text"
            value={entreprise.rib || ''}
            onChange={(e) => updateField('rib', e.target.value)}
            placeholder="FR76 1234 5678 9012 3456 7890 123"
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base font-mono
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Numerotation des documents */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Hash size={20} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Numerotation des documents</h2>
        </div>
        <p className="text-sm text-gray-500">
          Personnalisez le prefixe et le compteur de vos devis, factures et avoirs. Utile pour reprendre votre historique existant.
        </p>

        {/* Devis */}
        <div className="border border-gray-100 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Devis</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prefixe</label>
              <input
                type="text"
                value={entreprise.prefixDevis || 'D'}
                onChange={(e) => updateField('prefixDevis', e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-mono
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prochain numero</label>
              <input
                type="number"
                min={0}
                value={entreprise.sequenceDevis ?? 0}
                onChange={(e) => updateField('sequenceDevis', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-mono
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Apercu : <span className="font-mono font-medium text-gray-600">{entreprise.prefixDevis || 'D'}-{new Date().getFullYear()}-{String((entreprise.sequenceDevis ?? 0) + 1).padStart(3, '0')}</span>
          </p>
        </div>

        {/* Factures */}
        <div className="border border-gray-100 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Factures</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prefixe</label>
              <input
                type="text"
                value={entreprise.prefixFacture || 'F'}
                onChange={(e) => updateField('prefixFacture', e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-mono
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prochain numero</label>
              <input
                type="number"
                min={0}
                value={entreprise.sequenceFacture ?? 0}
                onChange={(e) => updateField('sequenceFacture', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-mono
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Apercu : <span className="font-mono font-medium text-gray-600">{entreprise.prefixFacture || 'F'}-{new Date().getFullYear()}-{String((entreprise.sequenceFacture ?? 0) + 1).padStart(3, '0')}</span>
          </p>
        </div>

        {/* Avoirs */}
        <div className="border border-gray-100 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Avoirs</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prefixe</label>
              <input
                type="text"
                value={entreprise.prefixAvoir || 'A'}
                onChange={(e) => updateField('prefixAvoir', e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-mono
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prochain numero</label>
              <input
                type="number"
                min={0}
                value={entreprise.sequenceAvoir ?? 0}
                onChange={(e) => updateField('sequenceAvoir', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm font-mono
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Apercu : <span className="font-mono font-medium text-gray-600">{entreprise.prefixAvoir || 'A'}-{new Date().getFullYear()}-{String((entreprise.sequenceAvoir ?? 0) + 1).padStart(3, '0')}</span>
          </p>
        </div>
      </div>

      {/* Apparence des documents */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette size={20} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Apparence des documents</h2>
        </div>
        <p className="text-sm text-gray-500">
          Personnalisez le look de vos devis et factures avec votre logo, vos couleurs et votre police.
        </p>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo de l&apos;entreprise</label>
          <div className="flex items-center gap-4">
            {entreprise.logoUrl ? (
              <div className="relative">
                <img
                  src={entreprise.logoUrl}
                  alt="Logo"
                  className="h-16 w-auto max-w-[200px] object-contain rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => setEntreprise({ ...entreprise, logoUrl: null })}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => logoInputRef.current?.click()}
                className="h-16 w-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center
                           cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Upload size={16} />
                  <span>Ajouter un logo</span>
                </div>
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
            {entreprise.logoUrl && (
              <button
                onClick={() => logoInputRef.current?.click()}
                className="text-sm text-blue-600 hover:underline"
              >
                Changer
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG ou SVG. 500 Ko max.</p>
        </div>

        {/* Couleur accent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Couleur principale</label>
          <div className="flex flex-wrap gap-2">
            {COULEURS_PRESETS.map((c) => (
              <button
                key={c.value}
                onClick={() => updateField('docCouleur', c.value)}
                className={`w-10 h-10 rounded-xl border-2 transition-all ${
                  (entreprise.docCouleur || '#2563EB') === c.value
                    ? 'border-gray-900 scale-110 shadow-md'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
            <div className="relative">
              <input
                type="color"
                value={entreprise.docCouleur || '#2563EB'}
                onChange={(e) => updateField('docCouleur', e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border-2 border-gray-200"
                title="Couleur personnalisee"
              />
            </div>
          </div>
        </div>

        {/* Police */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Police des documents</label>
          <select
            value={entreprise.docPolice || 'Inter'}
            onChange={(e) => updateField('docPolice', e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {POLICES.map((p) => (
              <option key={p.value} value={p.value} style={{ fontFamily: p.value }}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Mini apercu */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Apercu</p>
          <div className="border border-gray-200 rounded-xl p-4 bg-white" style={{ fontFamily: entreprise.docPolice || 'Inter' }}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {entreprise.logoUrl && (
                  <img src={entreprise.logoUrl} alt="" className="h-10 w-auto max-w-[80px] object-contain" />
                )}
                <div>
                  <p className="font-bold text-sm text-gray-900">{entreprise.nomEntreprise}</p>
                  <p className="text-xs text-gray-400">{entreprise.adresse}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm" style={{ color: entreprise.docCouleur || '#2563EB' }}>FACTURE</p>
                <p className="text-xs text-gray-500">{entreprise.prefixFacture || 'F'}-2026-001</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Designation</span>
                <span className="text-gray-400">Total HT</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-600">Exemple de prestation</span>
                <span className="text-gray-600">1 500,00 EUR</span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t text-sm font-bold">
                <span>Total TTC</span>
                <span style={{ color: entreprise.docCouleur || '#2563EB' }}>1 800,00 EUR</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mentions documents */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">Mentions sur les documents</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conditions de reglement par defaut</label>
          <input
            type="text"
            value={entreprise.conditionsReglement || ''}
            onChange={(e) => updateField('conditionsReglement', e.target.value)}
            placeholder="Ex: Reglement a 30 jours fin de mois"
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mentions additionnelles devis</label>
          <textarea
            value={entreprise.mentionsDevis || ''}
            onChange={(e) => updateField('mentionsDevis', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mentions additionnelles factures</label>
          <textarea
            value={entreprise.mentionsFacture || ''}
            onChange={(e) => updateField('mentionsFacture', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Bouton sauvegarder en bas */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl
                   font-semibold text-base active:scale-[0.98] transition-all ${
                     saved
                       ? 'bg-green-600 text-white'
                       : 'bg-blue-600 text-white'
                   }`}
      >
        <Save size={20} />
        {saving ? 'Sauvegarde...' : saved ? 'Sauvegarde !' : 'Sauvegarder les parametres'}
      </button>
    </div>
  );
}
