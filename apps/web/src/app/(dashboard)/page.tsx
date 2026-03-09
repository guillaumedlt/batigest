import { FileText, Receipt, AlertCircle, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour !</h1>
        <p className="text-gray-500 mt-1">Voici votre activite du jour</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-3">
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

      {/* Actions rapides */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">A faire</h2>
        <div className="text-center py-8 text-gray-400">
          <p className="text-base">Rien pour le moment</p>
          <p className="text-sm mt-1">Commencez par ajouter un client !</p>
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
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className={`inline-flex p-2 rounded-xl ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
