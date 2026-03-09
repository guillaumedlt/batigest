'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Receipt, ChevronRight, Clock, CheckCircle2, AlertCircle, Ban, CreditCard } from 'lucide-react';
import Link from 'next/link';

type Facture = {
  id: string;
  numero: string;
  type: string;
  statut: string;
  totalTTC: string;
  resteARegler: string;
  montantPaye: string;
  dateEmission: string;
  dateEcheance: string;
  contact: {
    id: string;
    nom: string;
    prenom: string | null;
    entreprise: string | null;
  };
  devis: { id: string; numero: string; objet: string } | null;
  _count: { lignes: number; paiements: number };
};

const STATUT_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  EMISE: 'Emise',
  PAYEE_PARTIELLEMENT: 'Paiement partiel',
  PAYEE: 'Payée',
  ANNULEE: 'Annulée',
};

const STATUT_COLORS: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-600',
  EMISE: 'bg-blue-100 text-blue-700',
  PAYEE_PARTIELLEMENT: 'bg-amber-100 text-amber-700',
  PAYEE: 'bg-green-100 text-green-700',
  ANNULEE: 'bg-red-100 text-red-700',
};

const STATUT_ICONS: Record<string, typeof Clock> = {
  BROUILLON: Clock,
  EMISE: AlertCircle,
  PAYEE_PARTIELLEMENT: CreditCard,
  PAYEE: CheckCircle2,
  ANNULEE: Ban,
};

const TYPE_LABELS: Record<string, string> = {
  CLASSIQUE: 'Classique',
  ACOMPTE: 'Acompte',
  SITUATION: 'Situation',
  AVOIR: 'Avoir',
};

function formatEuros(value: string | number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isOverdue(facture: Facture) {
  return (
    facture.statut === 'EMISE' &&
    new Date(facture.dateEcheance) < new Date()
  );
}

export default function FacturesListPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFactures();
  }, [search, filterStatut]);

  async function fetchFactures() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterStatut) params.set('statut', filterStatut);

    const res = await fetch(`/api/factures?${params}`);
    const data = await res.json();
    setFactures(data);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
        <Link
          href="/factures/nouvelle"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl
                     font-semibold text-sm active:scale-95 transition-transform min-h-[44px]"
        >
          <Plus size={18} />
          Nouvelle facture
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
            placeholder="Rechercher une facture..."
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-base
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
          {['', 'BROUILLON', 'EMISE', 'PAYEE_PARTIELLEMENT', 'PAYEE', 'ANNULEE'].map((statut) => (
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
              {statut === '' ? 'Toutes' : STATUT_LABELS[statut]}
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
      ) : factures.length === 0 ? (
        <div className="text-center py-12">
          <Receipt size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-lg font-medium text-gray-500">Aucune facture</p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Aucun resultat' : 'Creez votre premiere facture ou transformez un devis accepté !'}
          </p>
          {!search && (
            <Link
              href="/factures/nouvelle"
              className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white
                         px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              <Plus size={18} />
              Creer une facture
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* TABLEAU desktop */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Numero</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Client</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Statut</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Montant TTC</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Reste</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Echeance</th>
                  <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {factures.map((facture) => {
                  const StatutIcon = STATUT_ICONS[facture.statut] || Clock;
                  const overdue = isOverdue(facture);
                  return (
                    <tr
                      key={facture.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/factures/${facture.id}`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-mono text-sm font-medium text-gray-900">{facture.numero}</span>
                          {facture.type !== 'CLASSIQUE' && (
                            <span className="ml-2 text-xs text-gray-400">{TYPE_LABELS[facture.type]}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {facture.contact.nom}{facture.contact.prenom ? ` ${facture.contact.prenom}` : ''}
                        </p>
                        {facture.contact.entreprise && (
                          <p className="text-sm text-gray-500">{facture.contact.entreprise}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_COLORS[facture.statut]}`}>
                          <StatutIcon size={14} />
                          {STATUT_LABELS[facture.statut]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-900">{formatEuros(facture.totalTTC)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-medium ${Number(facture.resteARegler) > 0 ? (overdue ? 'text-red-600' : 'text-amber-600') : 'text-green-600'}`}>
                          {formatEuros(facture.resteARegler)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {formatDate(facture.dateEcheance)}
                          {overdue && ' ⚠'}
                        </span>
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

          {/* CARDS mobile */}
          <div className="lg:hidden space-y-2">
            {factures.map((facture) => {
              const StatutIcon = STATUT_ICONS[facture.statut] || Clock;
              const overdue = isOverdue(facture);
              return (
                <Link
                  key={facture.id}
                  href={`/factures/${facture.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm
                             active:bg-gray-50 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    overdue ? 'bg-red-50' : 'bg-green-50'
                  }`}>
                    <Receipt size={22} className={overdue ? 'text-red-600' : 'text-green-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">{facture.numero}</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_COLORS[facture.statut]}`}>
                        <StatutIcon size={12} />
                        {STATUT_LABELS[facture.statut]}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 truncate mt-0.5">
                      {facture.contact.nom}{facture.contact.prenom ? ` ${facture.contact.prenom}` : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-semibold text-sm text-gray-900">{formatEuros(facture.totalTTC)}</span>
                      {Number(facture.resteARegler) > 0 && (
                        <span className={`text-xs ${overdue ? 'text-red-600' : 'text-amber-600'}`}>
                          Reste {formatEuros(facture.resteARegler)}
                        </span>
                      )}
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
