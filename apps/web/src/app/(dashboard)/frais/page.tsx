'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Wallet, Car, Utensils, ParkingCircle, Package, CircleDollarSign, CheckCircle2, Filter } from 'lucide-react';
import Link from 'next/link';

type NoteFrais = {
  id: string;
  date: string;
  categorie: string;
  montant: string;
  tva: string | null;
  description: string;
  km: string | null;
  remboursee: boolean;
  chantierId: string | null;
};

type Stats = {
  totalMois: number | string;
  countMois: number;
  totalNonRembourse: number | string;
  countNonRembourse: number;
};

const CATEGORIE_LABELS: Record<string, string> = {
  CARBURANT: 'Carburant',
  PEAGE: 'Peage',
  RESTAURANT: 'Restaurant',
  FOURNITURES: 'Fournitures',
  PARKING: 'Parking',
  KILOMETRIQUE: 'Kilometrique',
  AUTRE: 'Autre',
};

const CATEGORIE_COLORS: Record<string, string> = {
  CARBURANT: 'bg-red-100 text-red-700',
  PEAGE: 'bg-blue-100 text-blue-700',
  RESTAURANT: 'bg-orange-100 text-orange-700',
  FOURNITURES: 'bg-purple-100 text-purple-700',
  PARKING: 'bg-cyan-100 text-cyan-700',
  KILOMETRIQUE: 'bg-green-100 text-green-700',
  AUTRE: 'bg-gray-100 text-gray-600',
};

const CATEGORIE_ICONS: Record<string, typeof Wallet> = {
  CARBURANT: CircleDollarSign,
  PEAGE: CircleDollarSign,
  RESTAURANT: Utensils,
  FOURNITURES: Package,
  PARKING: ParkingCircle,
  KILOMETRIQUE: Car,
  AUTRE: Wallet,
};

function formatEuros(value: string | number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FraisPage() {
  const [frais, setFrais] = useState<NoteFrais[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterCat) params.set('categorie', filterCat);

    fetch(`/api/frais?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setFrais(data.frais || []);
        setStats(data.stats || null);
        setLoading(false);
      });
  }, [search, filterCat]);

  async function toggleRembourse(id: string, current: boolean) {
    await fetch(`/api/frais/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remboursee: !current }),
    });
    setFrais(frais.map((f) => f.id === id ? { ...f, remboursee: !current } : f));
  }

  const total = frais.reduce((acc, f) => acc + Number(f.montant), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notes de frais</h1>
          <p className="text-sm text-gray-500 mt-0.5">Suivi des depenses professionnelles</p>
        </div>
        <Link
          href="/frais/nouveau"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl
                     font-semibold text-sm active:scale-95 transition-transform"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouvelle note</span>
        </Link>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Ce mois</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatEuros(stats.totalMois)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stats.countMois} note{stats.countMois > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Non rembourse</p>
            <p className="text-xl font-bold text-orange-600 mt-1">{formatEuros(stats.totalNonRembourse)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stats.countNonRembourse} note{stats.countNonRembourse > 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterCat('')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                       ${!filterCat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Filter size={12} />
            Tous
          </button>
          {Object.entries(CATEGORIE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterCat(filterCat === key ? '' : key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                         ${filterCat === key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : frais.length === 0 ? (
        <div className="text-center py-12">
          <Wallet size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Aucune note de frais</p>
          <p className="text-sm text-gray-400 mt-1">Commencez par ajouter vos depenses</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {frais.map((note) => {
              const CatIcon = CATEGORIE_ICONS[note.categorie] || Wallet;
              return (
                <div
                  key={note.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm transition-all
                             ${note.remboursee ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${CATEGORIE_COLORS[note.categorie]}`}>
                      <CatIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{note.description}</p>
                        {note.remboursee && (
                          <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{formatDate(note.date)}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${CATEGORIE_COLORS[note.categorie]}`}>
                          {CATEGORIE_LABELS[note.categorie]}
                        </span>
                        {note.km && <span>{note.km} km</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatEuros(note.montant)}</p>
                      <button
                        onClick={() => toggleRembourse(note.id, note.remboursee)}
                        className={`text-[10px] font-medium mt-0.5 ${note.remboursee ? 'text-green-600' : 'text-orange-600 hover:underline'}`}
                      >
                        {note.remboursee ? 'Remboursee' : 'Marquer remb.'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm text-gray-500">{frais.length} note{frais.length > 1 ? 's' : ''} affichee{frais.length > 1 ? 's' : ''}</span>
            <span className="font-bold text-gray-900">{formatEuros(total)}</span>
          </div>
        </>
      )}
    </div>
  );
}
