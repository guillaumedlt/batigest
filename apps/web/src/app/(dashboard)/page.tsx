import { FileText, Receipt, AlertCircle, TrendingUp, Plus, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bonjour !</h1>
          <p className="text-gray-500 mt-1">Voici votre activite du jour</p>
        </div>
        {/* Bouton ajout rapide — desktop */}
        <div className="hidden lg:flex gap-2">
          <Link
            href="/contacts/nouveau"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl
                       text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Users size={16} />
            Nouveau contact
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

      {/* Stats rapides — 2 colonnes mobile, 4 sur desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          label="Devis en attente"
          value="0"
          icon={<FileText size={20} />}
          color="text-blue-600 bg-blue-50"
        />
        <StatCard
          label="Factures impayees"
          value="0"
          icon={<AlertCircle size={20} />}
          color="text-red-600 bg-red-50"
        />
        <StatCard
          label="CA ce mois"
          value="0 EUR"
          icon={<TrendingUp size={20} />}
          color="text-green-600 bg-green-50"
        />
        <StatCard
          label="Factures du mois"
          value="0"
          icon={<Receipt size={20} />}
          color="text-amber-600 bg-amber-50"
        />
      </div>

      {/* 2 colonnes sur desktop : A faire + Activite recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* A faire */}
        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3 text-lg">A faire</h2>
          <div className="text-center py-8 text-gray-400">
            <Calendar size={40} className="mx-auto mb-2 text-gray-300" />
            <p className="text-base">Rien pour le moment</p>
            <p className="text-sm mt-1">Commencez par ajouter un client !</p>
          </div>
        </div>

        {/* Activite recente */}
        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3 text-lg">Activite recente</h2>
          <div className="text-center py-8 text-gray-400">
            <TrendingUp size={40} className="mx-auto mb-2 text-gray-300" />
            <p className="text-base">Pas encore d'activite</p>
            <p className="text-sm mt-1">Vos derniers devis et factures apparaitront ici</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm">
      <div className={`inline-flex p-2 rounded-xl ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-2xl lg:text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
