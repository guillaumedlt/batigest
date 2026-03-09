'use client';

import { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type ContactOption = {
  id: string;
  nom: string;
  prenom: string | null;
  entreprise: string | null;
};

type ChantierOption = {
  id: string;
  nom: string;
  statut: string;
};

const CATEGORIES = [
  { value: 'MATERIAUX', label: 'Materiaux' },
  { value: 'OUTILLAGE', label: 'Outillage' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'SOUS_TRAITANCE', label: 'Sous-traitance' },
  { value: 'AUTRE', label: 'Autre' },
];

const TVA_RATES = [
  { value: '20', label: '20%' },
  { value: '10', label: '10%' },
  { value: '5.5', label: '5,5%' },
  { value: '0', label: '0%' },
];

export default function NouvelAchatPageWrapper() {
  return (
    <Suspense fallback={<div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/3" /></div>}>
      <NouvelAchatPage />
    </Suspense>
  );
}

function NouvelAchatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [fournisseurs, setFournisseurs] = useState<ContactOption[]>([]);
  const [fournisseurSearch, setFournisseurSearch] = useState('');
  const [showFournisseurDropdown, setShowFournisseurDropdown] = useState(false);
  const [chantiers, setChantiers] = useState<ChantierOption[]>([]);

  const [form, setForm] = useState({
    designation: '',
    date: new Date().toISOString().split('T')[0],
    categorie: 'MATERIAUX',
    montantHT: '',
    tauxTVA: '20',
    fournisseurId: '',
    fournisseurLabel: '',
    chantierId: searchParams.get('chantierId') || '',
    notes: '',
  });

  useEffect(() => {
    fetch('/api/chantiers')
      .then((r) => r.json())
      .then((data) => setChantiers(data));
  }, []);

  useEffect(() => {
    if (fournisseurSearch.length >= 2) {
      fetch(`/api/contacts?search=${encodeURIComponent(fournisseurSearch)}&type=FOURNISSEUR`)
        .then((r) => r.json())
        .then((data) => {
          setFournisseurs(data);
          setShowFournisseurDropdown(true);
        });
    } else {
      setShowFournisseurDropdown(false);
    }
  }, [fournisseurSearch]);

  const montantHT = Number(form.montantHT) || 0;
  const tauxTVA = Number(form.tauxTVA) || 0;
  const montantTVA = montantHT * tauxTVA / 100;
  const montantTTC = montantHT + montantTVA;

  function formatEuros(val: number) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch('/api/achats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        designation: form.designation,
        date: form.date,
        categorie: form.categorie,
        montantHT: form.montantHT,
        tauxTVA: form.tauxTVA,
        fournisseurId: form.fournisseurId || null,
        chantierId: form.chantierId || null,
        notes: form.notes || null,
      }),
    });

    if (res.ok) {
      const achat = await res.json();
      router.push(`/achats/${achat.id}`);
    } else {
      const err = await res.json();
      alert(err.error || 'Erreur lors de la creation.');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/achats" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouvel achat</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos principales */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
            <input
              type="text"
              required
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              placeholder="Ex: Sac de ciment 25kg x10"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categorie *</label>
              <select
                value={form.categorie}
                onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fournisseur */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
            <input
              type="text"
              value={form.fournisseurId ? form.fournisseurLabel : fournisseurSearch}
              onChange={(e) => {
                if (form.fournisseurId) {
                  setForm({ ...form, fournisseurId: '', fournisseurLabel: '' });
                }
                setFournisseurSearch(e.target.value);
              }}
              placeholder="Rechercher un fournisseur..."
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {form.fournisseurId && (
              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, fournisseurId: '', fournisseurLabel: '' });
                  setFournisseurSearch('');
                }}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 text-sm"
              >
                Changer
              </button>
            )}
            {showFournisseurDropdown && fournisseurs.length > 0 && !form.fournisseurId && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {fournisseurs.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      const label = f.entreprise || `${f.nom} ${f.prenom || ''}`.trim();
                      setForm({ ...form, fournisseurId: f.id, fournisseurLabel: label });
                      setShowFournisseurDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm"
                  >
                    <p className="font-medium text-gray-900">{f.entreprise || `${f.nom} ${f.prenom || ''}`}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
            <select
              value={form.chantierId}
              onChange={(e) => setForm({ ...form, chantierId: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Aucun chantier</option>
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Montants */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Montants</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant HT *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={form.montantHT}
                onChange={(e) => setForm({ ...form, montantHT: e.target.value })}
                placeholder="0.00"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taux TVA *</label>
              <select
                value={form.tauxTVA}
                onChange={(e) => setForm({ ...form, tauxTVA: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {TVA_RATES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recap montants */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Montant HT</span>
              <span className="text-gray-900">{formatEuros(montantHT)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">TVA ({form.tauxTVA}%)</span>
              <span className="text-gray-900">{formatEuros(montantTVA)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200">
              <span>Total TTC</span>
              <span>{formatEuros(montantTTC)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Notes supplementaires..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !form.designation || !form.montantHT}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white
                     px-6 py-4 rounded-xl font-semibold text-base
                     active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none"
        >
          <Save size={20} />
          {saving ? 'Enregistrement...' : 'Enregistrer l\'achat'}
        </button>
      </form>
    </div>
  );
}
