'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ContactOption = {
  id: string;
  nom: string;
  prenom: string | null;
  entreprise: string | null;
};

const STATUTS = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'GARANTIE', label: 'Garantie' },
];

export default function NouveauChantierPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<ContactOption[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [form, setForm] = useState({
    nom: '',
    clientId: '',
    clientLabel: '',
    adresse: '',
    codePostal: '',
    ville: '',
    statut: 'EN_ATTENTE',
    dateDebut: '',
    dateFin: '',
    description: '',
    notes: '',
    budgetPrevu: '',
  });

  useEffect(() => {
    if (clientSearch.length >= 2) {
      fetch(`/api/contacts?search=${encodeURIComponent(clientSearch)}&type=CLIENT`)
        .then((r) => r.json())
        .then((data) => {
          setClients(data);
          setShowClientDropdown(true);
        });
    } else {
      setShowClientDropdown(false);
    }
  }, [clientSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch('/api/chantiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: form.nom,
        clientId: form.clientId || null,
        adresse: form.adresse || null,
        codePostal: form.codePostal || null,
        ville: form.ville || null,
        statut: form.statut,
        dateDebut: form.dateDebut || null,
        dateFin: form.dateFin || null,
        description: form.description || null,
        notes: form.notes || null,
        budgetPrevu: form.budgetPrevu || null,
      }),
    });

    if (res.ok) {
      const chantier = await res.json();
      router.push(`/chantiers/${chantier.id}`);
    } else {
      const err = await res.json();
      alert(err.error || 'Erreur lors de la création.');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/chantiers" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau chantier</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos principales */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du chantier *</label>
            <input
              type="text"
              required
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex: Rénovation appartement Dupont"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {STATUTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget prévu</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.budgetPrevu}
                onChange={(e) => setForm({ ...form, budgetPrevu: e.target.value })}
                placeholder="0.00 €"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Client */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <input
              type="text"
              value={form.clientId ? form.clientLabel : clientSearch}
              onChange={(e) => {
                if (form.clientId) {
                  setForm({ ...form, clientId: '', clientLabel: '' });
                }
                setClientSearch(e.target.value);
              }}
              placeholder="Rechercher un client..."
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {form.clientId && (
              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, clientId: '', clientLabel: '' });
                  setClientSearch('');
                }}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 text-sm"
              >
                Changer
              </button>
            )}
            {showClientDropdown && clients.length > 0 && !form.clientId && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      const label = c.entreprise || `${c.nom} ${c.prenom || ''}`.trim();
                      setForm({ ...form, clientId: c.id, clientLabel: label });
                      setShowClientDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm"
                  >
                    <p className="font-medium text-gray-900">{c.entreprise || `${c.nom} ${c.prenom || ''}`}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
              <input
                type="date"
                value={form.dateDebut}
                onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin prévue</label>
              <input
                type="date"
                value={form.dateFin}
                onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Adresse du chantier</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input
              type="text"
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              placeholder="Rue, numéro..."
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
              <input
                type="text"
                value={form.codePostal}
                onChange={(e) => setForm({ ...form, codePostal: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                type="text"
                value={form.ville}
                onChange={(e) => setForm({ ...form, ville: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Description + Notes */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Description des travaux..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes internes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Notes..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !form.nom}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white
                     px-6 py-4 rounded-xl font-semibold text-base
                     active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none"
        >
          <Save size={20} />
          {saving ? 'Création...' : 'Créer le chantier'}
        </button>
      </form>
    </div>
  );
}
