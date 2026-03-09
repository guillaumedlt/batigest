'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, FileText, ChevronRight, Clock, CheckCircle2, XCircle, Send, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type Devis = {
  id: string;
  numero: string;
  objet: string;
  statut: string;
  totalHT: string;
  totalTTC: string;
  dateCreation: string;
  dateValidite: string;
  contact: {
    id: string;
    nom: string;
    prenom: string | null;
    entreprise: string | null;
  };
  _count: { lignes: number };
};

const STATUT_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  ENVOYE: 'Envoyé',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
  EXPIRE: 'Expiré',
};

const STATUT_COLORS: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-600',
  ENVOYE: 'bg-blue-100 text-blue-700',
  ACCEPTE: 'bg-green-100 text-green-700',
  REFUSE: 'bg-red-100 text-red-700',
  EXPIRE: 'bg-amber-100 text-amber-700',
};

const STATUT_ICONS: Record<string, typeof Clock> = {
  BROUILLON: Clock,
  ENVOYE: Send,
  ACCEPTE: CheckCircle2,
  REFUSE: XCircle,
  EXPIRE: AlertTriangle,
};

function formatEuros(value: string | number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function DevisListPage() {
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevis();
  }, [search, filterStatut]);

  async function fetchDevis() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterStatut) params.set('statut', filterStatut);

    const res = await fetch(`/api/devis?${params}`);
    const data = await res.json();
    setDevisList(data);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Devis</h1>
        <Link
          href="/devis/nouveau"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl
                     font-semibold text-sm active:scale-95 transition-transform min-h-[44px]"
        >
          <Plus size={18} />
          Nouveau devis
        </Link>
      </div>

      {/* Recherche + filtres */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un devis..."
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-base
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
          {['', 'BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE'].map((statut) => (
            <button
              key={statut}
              onClick={() => setFilterStatut(statut)}
              className={`px-3 py-1.5 lg:px-4 lg:py-2.5 rounded-full text-sm font-medium whitespace-nowrap min-h-[36px] lg:min-h-[44px]
                         transition-colors ${
                           filterStatut === statut
                             ? 'bg-blue-600 text-white'
                             : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                         }`}
            >
              {statut === '' ? 'Tous' : STATUT_LABELS[statut]}
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
      ) : devisList.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-lg font-medium text-gray-500">Aucun devis</p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Aucun resultat pour cette recherche' : 'Creez votre premier devis !'}
          </p>
          {!search && (
            <Link
              href="/devis/nouveau"
              className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white
                         px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              <Plus size={18} />
              Creer un devis
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Vue TABLEAU — desktop */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Numero</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Client</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Objet</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Statut</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Montant TTC</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
                  <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {devisList.map((devis) => {
                  const StatutIcon = STATUT_ICONS[devis.statut] || Clock;
                  return (
                    <tr
                      key={devis.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/devis/${devis.id}`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-gray-900">{devis.numero}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {devis.contact.nom}{devis.contact.prenom ? ` ${devis.contact.prenom}` : ''}
                          </p>
                          {devis.contact.entreprise && (
                            <p className="text-sm text-gray-500">{devis.contact.entreprise}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">{devis.objet}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_COLORS[devis.statut]}`}>
                          <StatutIcon size={14} />
                          {STATUT_LABELS[devis.statut]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-900">{formatEuros(devis.totalTTC)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(devis.dateCreation)}</td>
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
          <div className="lg:hidden space-y-2">
            {devisList.map((devis) => {
              const StatutIcon = STATUT_ICONS[devis.statut] || Clock;
              return (
                <Link
                  key={devis.id}
                  href={`/devis/${devis.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm
                             active:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={22} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{devis.objet}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-gray-400">{devis.numero}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {devis.contact.nom}{devis.contact.prenom ? ` ${devis.contact.prenom}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_COLORS[devis.statut]}`}>
                        <StatutIcon size={12} />
                        {STATUT_LABELS[devis.statut]}
                      </span>
                      <span className="font-semibold text-sm text-gray-900">{formatEuros(devis.totalTTC)}</span>
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
