'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Library } from 'lucide-react';

type Prestation = {
  id: string;
  designation: string;
  description: string | null;
  unite: string;
  prixUnitaireHT: string;
  tauxTVA: string;
  categorie: string | null;
};

function formatEuros(val: number | string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(val));
}

export default function PrestationsPage() {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    designation: '',
    description: '',
    unite: 'u',
    prixUnitaireHT: '',
    tauxTVA: '20',
    categorie: '',
  });

  useEffect(() => {
    fetchPrestations();
  }, [search]);

  function fetchPrestations() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/prestations?${params}`)
      .then((r) => r.json())
      .then(setPrestations)
      .finally(() => setLoading(false));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/prestations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ designation: '', description: '', unite: 'u', prixUnitaireHT: '', tauxTVA: '20', categorie: '' });
      setShowForm(false);
      fetchPrestations();
    } else {
      const err = await res.json();
      alert(err.error || 'Erreur');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette prestation ?')) return;
    await fetch(`/api/prestations?id=${id}`, { method: 'DELETE' });
    fetchPrestations();
  }

  // Group by category
  const grouped: Record<string, Prestation[]> = {};
  prestations.forEach((p) => {
    const cat = p.categorie || 'Sans catégorie';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bibliothèque de prestations</h1>
          <p className="text-gray-500 mt-1">{prestations.length} prestation{prestations.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-xl text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm space-y-4 border-2 border-blue-200">
          <h2 className="font-semibold text-gray-900">Nouvelle prestation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Désignation *</label>
              <input
                type="text"
                required
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="Ex: Pose carrelage 30x30"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description optionnelle"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unité *</label>
              <select
                value={form.unite}
                onChange={(e) => setForm({ ...form, unite: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="u">Unité (u)</option>
                <option value="m2">m²</option>
                <option value="ml">ml</option>
                <option value="m3">m³</option>
                <option value="h">Heure (h)</option>
                <option value="j">Jour (j)</option>
                <option value="forfait">Forfait</option>
                <option value="kg">kg</option>
                <option value="lot">Lot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire HT *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={form.prixUnitaireHT}
                onChange={(e) => setForm({ ...form, prixUnitaireHT: e.target.value })}
                placeholder="0.00"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taux TVA</label>
              <select
                value={form.tauxTVA}
                onChange={(e) => setForm({ ...form, tauxTVA: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="20">20%</option>
                <option value="10">10%</option>
                <option value="5.5">5,5%</option>
                <option value="0">0%</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <input
                type="text"
                value={form.categorie}
                onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                placeholder="Ex: Carrelage, Plomberie..."
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 rounded-xl text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Ajout...' : 'Ajouter'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une prestation..."
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-2xl" />)}
        </div>
      ) : prestations.length === 0 ? (
        <div className="text-center py-16">
          <Library size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-lg">Aucune prestation</p>
          <p className="text-gray-400 text-sm mt-1">
            Créez vos prestations récurrentes pour gagner du temps sur les devis
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{cat}</h2>
              <div className="space-y-2">
                {items.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{p.designation}</p>
                      {p.description && <p className="text-sm text-gray-400 truncate">{p.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900">
                        {formatEuros(p.prixUnitaireHT)} / {p.unite}
                      </p>
                      <p className="text-xs text-gray-400">TVA {Number(p.tauxTVA)}%</p>
                    </div>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
