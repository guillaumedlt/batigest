'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, ShoppingBag, ChevronRight, Package, Wrench, Truck, Users, HelpCircle } from 'lucide-react';
import Link from 'next/link';

type FicheAchat = {
  id: string;
  designation: string;
  categorie: string;
  date: string;
  montantHT: string;
  montantTTC: string;
  tauxTVA: string;
  chantierId: string | null;
  chantier: { id: string; nom: string } | null;
  notes: string | null;
  fournisseur: {
    id: string;
    nom: string;
    prenom: string | null;
    entreprise: string | null;
  } | null;
};

const CATEGORIE_LABELS: Record<string, string> = {
  MATERIAUX: 'Materiaux',
  OUTILLAGE: 'Outillage',
  LOCATION: 'Location',
  SOUS_TRAITANCE: 'Sous-traitance',
  AUTRE: 'Autre',
};

const CATEGORIE_COLORS: Record<string, string> = {
  MATERIAUX: 'bg-orange-100 text-orange-700',
  OUTILLAGE: 'bg-purple-100 text-purple-700',
  LOCATION: 'bg-blue-100 text-blue-700',
  SOUS_TRAITANCE: 'bg-green-100 text-green-700',
  AUTRE: 'bg-gray-100 text-gray-600',
};

const CATEGORIE_ICONS: Record<string, typeof Package> = {
  MATERIAUX: Package,
  OUTILLAGE: Wrench,
  LOCATION: Truck,
  SOUS_TRAITANCE: Users,
  AUTRE: HelpCircle,
};

function formatEuros(value: string | number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AchatsListPage() {
  const [achats, setAchats] = useState<FicheAchat[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchats();
  }, [search, filterCategorie]);

  async function fetchAchats() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterCategorie) params.set('categorie', filterCategorie);

    const res = await fetch(`/api/achats?${params}`);
    const data = await res.json();
    setAchats(data);
    setLoading(false);
  }

  // Totaux
  const totalHT = achats.reduce((sum, a) => sum + Number(a.montantHT), 0);
  const totalTTC = achats.reduce((sum, a) => sum + Number(a.montantTTC), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Achats</h1>
        <Link
          href="/achats/nouveau"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl
                     font-semibold text-sm active:scale-95 transition-transform min-h-[44px]"
        >
          <Plus size={18} />
          Nouvel achat
        </Link>
      </div>

      {/* Stats rapides */}
      {achats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total HT</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatEuros(totalHT)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total TTC</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatEuros(totalTTC)}</p>
          </div>
        </div>
      )}

      {/* Recherche + filtres */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un achat..."
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-base
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {['', 'MATERIAUX', 'OUTILLAGE', 'LOCATION', 'SOUS_TRAITANCE', 'AUTRE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategorie(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap min-h-[44px]
                         transition-colors ${
                           filterCategorie === cat
                             ? 'bg-blue-600 text-white'
                             : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                         }`}
            >
              {cat === '' ? 'Tous' : CATEGORIE_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : achats.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-lg font-medium text-gray-500">Aucun achat</p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Aucun resultat pour cette recherche' : 'Enregistrez votre premier achat !'}
          </p>
          {!search && (
            <Link
              href="/achats/nouveau"
              className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white
                         px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              <Plus size={18} />
              Nouvel achat
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Vue TABLEAU — desktop */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Designation</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Fournisseur</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Categorie</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Chantier</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Montant TTC</th>
                  <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {achats.map((achat) => {
                  const CatIcon = CATEGORIE_ICONS[achat.categorie] || HelpCircle;
                  return (
                    <tr
                      key={achat.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/achats/${achat.id}`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(achat.date)}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{achat.designation}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {achat.fournisseur
                          ? (achat.fournisseur.entreprise || `${achat.fournisseur.nom} ${achat.fournisseur.prenom || ''}`.trim())
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORIE_COLORS[achat.categorie]}`}>
                          <CatIcon size={14} />
                          {CATEGORIE_LABELS[achat.categorie]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{achat.chantier?.nom || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-900">{formatEuros(achat.montantTTC)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <ChevronRight size={16} className="text-gray-300" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vue CARDS — mobile */}
          <div className="md:hidden space-y-2">
            {achats.map((achat) => {
              const CatIcon = CATEGORIE_ICONS[achat.categorie] || HelpCircle;
              return (
                <Link
                  key={achat.id}
                  href={`/achats/${achat.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm
                             active:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CatIcon size={22} className="text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{achat.designation}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{formatDate(achat.date)}</span>
                      {achat.fournisseur && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 truncate">
                            {achat.fournisseur.entreprise || achat.fournisseur.nom}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORIE_COLORS[achat.categorie]}`}>
                        {CATEGORIE_LABELS[achat.categorie]}
                      </span>
                      <span className="font-semibold text-sm text-gray-900">{formatEuros(achat.montantTTC)}</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
