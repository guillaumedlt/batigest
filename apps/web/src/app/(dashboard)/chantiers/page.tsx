'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, HardHat, MapPin, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type Chantier = {
  id: string;
  nom: string;
  statut: string;
  adresse: string | null;
  ville: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  budgetPrevu: string | null;
  client: { id: string; nom: string; prenom: string | null; entreprise: string | null } | null;
  _count: { devis: number; factures: number; achats: number; frais: number };
  caFacture: number;
  couts: number;
  marge: number;
  encaisse: number;
};

const STATUTS = [
  { value: '', label: 'Tous' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'GARANTIE', label: 'Garantie' },
];

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: 'bg-gray-100 text-gray-600',
  EN_COURS: 'bg-blue-100 text-blue-700',
  TERMINE: 'bg-green-100 text-green-700',
  GARANTIE: 'bg-amber-100 text-amber-700',
};

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  GARANTIE: 'Garantie',
};

function formatEuros(val: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
}

export default function ChantiersPage() {
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statutFilter) params.set('statut', statutFilter);

    fetch(`/api/chantiers?${params}`)
      .then((r) => r.json())
      .then(setChantiers)
      .finally(() => setLoading(false));
  }, [search, statutFilter]);

  const totalCA = chantiers.reduce((s, c) => s + c.caFacture, 0);
  const totalCouts = chantiers.reduce((s, c) => s + c.couts, 0);
  const enCours = chantiers.filter((c) => c.statut === 'EN_COURS').length;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Chantiers</h1>
          <p className="text-gray-500 mt-1">{chantiers.length} chantier{chantiers.length > 1 ? 's' : ''} · {enCours} en cours</p>
        </div>
        <Link
          href="/chantiers/nouveau"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-xl text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nouveau chantier</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="inline-flex p-2 rounded-xl bg-blue-50 text-blue-600 mb-2">
            <HardHat size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{enCours}</p>
          <p className="text-sm text-gray-500">En cours</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="inline-flex p-2 rounded-xl bg-green-50 text-green-600 mb-2">
            <TrendingUp size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatEuros(totalCA)}</p>
          <p className="text-sm text-gray-500">CA facturé</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="inline-flex p-2 rounded-xl bg-red-50 text-red-600 mb-2">
            <AlertCircle size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatEuros(totalCouts)}</p>
          <p className="text-sm text-gray-500">Coûts totaux</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className={`inline-flex p-2 rounded-xl mb-2 ${totalCA - totalCouts >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            <TrendingUp size={20} />
          </div>
          <p className={`text-2xl font-bold ${totalCA - totalCouts >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatEuros(totalCA - totalCouts)}
          </p>
          <p className="text-sm text-gray-500">Marge globale</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un chantier..."
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-base
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatutFilter(s.value)}
              className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors
                ${statutFilter === s.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : chantiers.length === 0 ? (
        <div className="text-center py-16">
          <HardHat size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-lg">Aucun chantier</p>
          <p className="text-gray-400 text-sm mt-1">Créez votre premier chantier pour suivre vos projets</p>
          <Link href="/chantiers/nouveau"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-blue-600 rounded-xl text-sm font-medium text-white">
            <Plus size={16} /> Nouveau chantier
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {chantiers.map((c) => {
            const clientName = c.client
              ? c.client.entreprise || `${c.client.nom} ${c.client.prenom || ''}`.trim()
              : null;
            return (
              <Link key={c.id} href={`/chantiers/${c.id}`}
                className="block bg-white rounded-2xl p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{c.nom}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_COLORS[c.statut]}`}>
                        {STATUT_LABELS[c.statut]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      {clientName && <span>{clientName}</span>}
                      {c.ville && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> {c.ville}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-lg font-bold ${c.marge >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatEuros(c.marge)}
                    </p>
                    <p className="text-xs text-gray-400">marge</p>
                  </div>
                </div>
                {/* Mini bar */}
                {c.caFacture > 0 && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: `${Math.min((c.encaisse / c.caFacture) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatEuros(c.encaisse)} / {formatEuros(c.caFacture)}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
