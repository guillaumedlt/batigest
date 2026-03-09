'use client';

import { useState, useEffect } from 'react';
import { Save, Building2, FileText, Shield } from 'lucide-react';

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

export default function ParametresPage() {
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  function updateField(field: string, value: string | boolean) {
    if (!entreprise) return;
    setEntreprise({ ...entreprise, [field]: value });
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-2 gap-4">
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
        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
