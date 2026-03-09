'use client';

import { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, Save, Car } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type ChantierOption = {
  id: string;
  nom: string;
  statut: string;
};

const CATEGORIES = [
  { value: 'CARBURANT', label: 'Carburant' },
  { value: 'PEAGE', label: 'Peage' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'FOURNITURES', label: 'Fournitures' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'KILOMETRIQUE', label: 'Indemnite km' },
  { value: 'AUTRE', label: 'Autre' },
];

const TVA_RATES = [
  { value: '', label: 'Pas de TVA' },
  { value: '20', label: '20%' },
  { value: '10', label: '10%' },
  { value: '5.5', label: '5,5%' },
];

// Bareme kilometrique fiscal 2024 (voiture, 5 CV)
function estimerIndemniteKm(km: number): number {
  if (km <= 5000) return Math.round(km * 0.636 * 100) / 100;
  if (km <= 20000) return Math.round((km * 0.340 + 1330) * 100) / 100;
  return Math.round(km * 0.405 * 100) / 100;
}

export default function NouvelleNoteFraisPageWrapper() {
  return (
    <Suspense fallback={<div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/3" /></div>}>
      <NouvelleNoteFraisPage />
    </Suspense>
  );
}

function NouvelleNoteFraisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [chantiers, setChantiers] = useState<ChantierOption[]>([]);

  useEffect(() => {
    fetch('/api/chantiers')
      .then((r) => r.json())
      .then((data) => setChantiers(data));
  }, []);

  const [form, setForm] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0],
    categorie: 'CARBURANT',
    montant: '',
    tauxTVA: '',
    km: '',
    chantierId: searchParams.get('chantierId') || '',
  });

  const isKm = form.categorie === 'KILOMETRIQUE';
  const montant = isKm ? estimerIndemniteKm(Number(form.km) || 0) : Number(form.montant) || 0;
  const tauxTVA = Number(form.tauxTVA) || 0;
  const tva = isKm ? 0 : montant * tauxTVA / 100;

  function formatEuros(val: number) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload: Record<string, unknown> = {
      description: form.description,
      date: form.date,
      categorie: form.categorie,
      chantierId: form.chantierId || null,
    };

    if (isKm) {
      payload.km = Number(form.km);
    } else {
      payload.montant = Number(form.montant);
      if (tva > 0) payload.tva = tva;
    }

    const res = await fetch('/api/frais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push('/frais');
    } else {
      const err = await res.json();
      alert(err.error || 'Erreur lors de la creation.');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/frais" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle note de frais</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Plein diesel camionnette"
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
          <h2 className="font-semibold text-gray-900">
            {isKm ? 'Indemnites kilometriques' : 'Montant'}
          </h2>

          {isKm ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kilometres parcourus *</label>
                <div className="relative">
                  <Car size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="0"
                    value={form.km}
                    onChange={(e) => setForm({ ...form, km: e.target.value })}
                    placeholder="Ex: 45"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-base
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Bareme fiscal 2024</span> (voiture 5 CV)
                </p>
                <ul className="text-xs text-green-700 mt-1 space-y-0.5">
                  <li>0 - 5 000 km : 0,636 EUR/km</li>
                  <li>5 001 - 20 000 km : 0,340 EUR/km + 1 330 EUR</li>
                  <li>Au-dela : 0,405 EUR/km</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={form.montant}
                  onChange={(e) => setForm({ ...form, montant: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TVA recuperable</label>
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
          )}

          {/* Recapitulatif */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {isKm && Number(form.km) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{form.km} km parcourus</span>
              </div>
            )}
            {!isKm && tva > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">TVA recuperable ({form.tauxTVA}%)</span>
                <span className="text-gray-900">{formatEuros(tva)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200">
              <span>{isKm ? 'Indemnite calculee' : 'Montant'}</span>
              <span>{formatEuros(montant)}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !form.description || (!isKm && !form.montant) || (isKm && !form.km)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white
                     px-6 py-4 rounded-xl font-semibold text-base
                     active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none"
        >
          <Save size={20} />
          {saving ? 'Enregistrement...' : 'Enregistrer la note de frais'}
        </button>
      </form>
    </div>
  );
}
