'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Receipt, AlertCircle, TrendingUp, Plus,
  HardHat, ArrowDownRight, Calendar,
} from 'lucide-react';
import Link from 'next/link';

type DashboardStats = {
  devisEnAttente: number;
  nbImpayees: number;
  totalImpayes: number;
  nbRetard: number;
  caMois: number;
  nbFacturesMois: number;
  totalEncaisse: number;
  depensesMois: number;
  caMensuel: { mois: string; ca: number; depenses: number }[];
  chantiersEnCours: { id: string; nom: string; ville: string | null }[];
  evenements: { id: string; titre: string; type: string; dateDebut: string; journeeEntiere: boolean }[];
  dernDevis: { id: string; numero: string; objet: string; statut: string; totalTTC: string; createdAt: string }[];
  dernFactures: { id: string; numero: string; type: string; statut: string; totalTTC: string; createdAt: string }[];
};

function formatEuros(val: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const EVENT_COLORS: Record<string, string> = {
  CHANTIER: 'bg-orange-100 text-orange-700',
  RDV_CLIENT: 'bg-blue-100 text-blue-700',
  RDV_FOURNISSEUR: 'bg-purple-100 text-purple-700',
  RELANCE: 'bg-red-100 text-red-700',
  PERSO: 'bg-gray-100 text-gray-700',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxCA = Math.max(...stats.caMensuel.map((m) => Math.max(m.ca, m.depenses)), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bonjour !</h1>
          <p className="text-gray-500 mt-1">Voici votre activité du jour</p>
        </div>
        <div className="hidden lg:flex gap-2">
          <Link
            href="/chantiers/nouveau"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl
                       text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <HardHat size={16} />
            Nouveau chantier
          </Link>
          <Link
            href="/devis/nouveau"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-xl
                       text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Nouveau devis
          </Link>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          label="Devis en attente"
          value={String(stats.devisEnAttente)}
          icon={<FileText size={20} />}
          color="text-blue-600 bg-blue-50"
        />
        <StatCard
          label="Factures impayées"
          value={stats.nbImpayees > 0 ? `${stats.nbImpayees}` : '0'}
          subtitle={stats.totalImpayes > 0 ? formatEuros(stats.totalImpayes) : undefined}
          icon={<AlertCircle size={20} />}
          color={stats.nbRetard > 0 ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'}
          badge={stats.nbRetard > 0 ? `${stats.nbRetard} en retard` : undefined}
        />
        <StatCard
          label="CA ce mois"
          value={formatEuros(stats.caMois)}
          icon={<TrendingUp size={20} />}
          color="text-green-600 bg-green-50"
        />
        <StatCard
          label="Dépenses du mois"
          value={formatEuros(stats.depensesMois)}
          icon={<ArrowDownRight size={20} />}
          color="text-orange-600 bg-orange-50"
        />
      </div>

      {/* CA Chart + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Chart CA */}
        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Chiffre d&apos;affaires</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-500" /> CA
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-orange-400" /> Dépenses
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2 h-40">
            {stats.caMensuel.map((m) => (
              <div key={m.mois} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end" style={{ height: '120px' }}>
                  <div
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{ height: `${(m.ca / maxCA) * 100}%`, minHeight: m.ca > 0 ? '4px' : '0' }}
                  />
                  <div
                    className="flex-1 bg-orange-400 rounded-t"
                    style={{ height: `${(m.depenses / maxCA) * 100}%`, minHeight: m.depenses > 0 ? '4px' : '0' }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">{m.mois}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400">Encaissé ce mois</p>
              <p className="text-lg font-bold text-green-600">{formatEuros(stats.totalEncaisse)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Résultat</p>
              <p className={`text-lg font-bold ${stats.caMois - stats.depensesMois >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatEuros(stats.caMois - stats.depensesMois)}
              </p>
            </div>
          </div>
        </div>

        {/* Agenda du jour */}
        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Agenda</h2>
            <Link href="/calendrier" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
          </div>
          {stats.evenements.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar size={40} className="mx-auto mb-2 text-gray-300" />
              <p>Rien de prévu aujourd&apos;hui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.evenements.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium ${EVENT_COLORS[ev.type] || 'bg-gray-100 text-gray-600'}`}>
                    {ev.journeeEntiere ? 'Journée' : formatTime(ev.dateDebut)}
                  </span>
                  <span className="text-sm text-gray-700 flex-1 truncate">{ev.titre}</span>
                </div>
              ))}
            </div>
          )}

          {/* Chantiers en cours */}
          {stats.chantiersEnCours.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Chantiers en cours</h3>
              <div className="space-y-1.5">
                {stats.chantiersEnCours.map((ch) => (
                  <Link key={ch.id} href={`/chantiers/${ch.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm">
                    <HardHat size={16} className="text-blue-500" />
                    <span className="text-gray-700 flex-1 truncate">{ch.nom}</span>
                    {ch.ville && <span className="text-xs text-gray-400">{ch.ville}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Derniers devis</h2>
          {stats.dernDevis.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Aucun devis</p>
          ) : (
            <div className="space-y-2">
              {stats.dernDevis.map((d) => (
                <Link key={d.id} href={`/devis/${d.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <FileText size={16} className="text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{d.numero} — {d.objet}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatEuros(Number(d.totalTTC))}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Dernières factures</h2>
          {stats.dernFactures.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Aucune facture</p>
          ) : (
            <div className="space-y-2">
              {stats.dernFactures.map((f) => (
                <Link key={f.id} href={`/factures/${f.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <Receipt size={16} className="text-green-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{f.numero}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatEuros(Number(f.totalTTC))}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  icon,
  color,
  badge,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm">
      <div className={`inline-flex p-2 rounded-xl ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-2xl lg:text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      <p className="text-sm text-gray-500">{label}</p>
      {badge && (
        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
          {badge}
        </span>
      )}
    </div>
  );
}
