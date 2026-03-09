'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, Edit, Trash2, Package, Wrench, Truck, Users, HelpCircle, Calendar, MapPin, StickyNote } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
  fournisseur: {
    id: string;
    nom: string;
    prenom: string | null;
    entreprise: string | null;
    telephone: string | null;
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
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function AchatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [achat, setAchat] = useState<FicheAchat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/achats/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push('/achats');
          return;
        }
        setAchat(data);
        setLoading(false);
      });
  }, [id, router]);

  async function handleDelete() {
    if (!confirm('Supprimer cette fiche d\'achat ?')) return;
    const res = await fetch(`/api/achats/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/achats');
  }

  if (loading || !achat) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  const CatIcon = CATEGORIE_ICONS[achat.categorie] || HelpCircle;
  const montantTVA = Number(achat.montantTTC) - Number(achat.montantHT);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/achats" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{achat.designation}</h1>
            <p className="text-sm text-gray-500">{formatDate(achat.date)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/achats/${id}/modifier`}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white
                     px-4 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
        >
          <Edit size={16} />
          Modifier
        </Link>
        <button
          onClick={handleDelete}
          className="flex items-center justify-center gap-2 bg-red-50 text-red-600
                     px-4 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
        >
          <Trash2 size={16} />
          Supprimer
        </button>
      </div>

      {/* Infos principales */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
            <CatIcon size={24} className="text-orange-600" />
          </div>
          <div>
            <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-medium ${CATEGORIE_COLORS[achat.categorie]}`}>
              <CatIcon size={14} />
              {CATEGORIE_LABELS[achat.categorie]}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Calendar size={16} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Date d&apos;achat</p>
              <p className="font-medium text-gray-900">{formatDate(achat.date)}</p>
            </div>
          </div>

          {achat.fournisseur && (
            <div className="flex items-start gap-3">
              <Users size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Fournisseur</p>
                <p className="font-medium text-gray-900">
                  {achat.fournisseur.entreprise || `${achat.fournisseur.nom} ${achat.fournisseur.prenom || ''}`}
                </p>
                {achat.fournisseur.telephone && (
                  <a href={`tel:${achat.fournisseur.telephone}`} className="text-sm text-blue-600">
                    {achat.fournisseur.telephone}
                  </a>
                )}
              </div>
            </div>
          )}

          {achat.chantierId && (
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Reference chantier</p>
                <p className="font-medium text-gray-900">{achat.chantierId}</p>
              </div>
            </div>
          )}

          {achat.notes && (
            <div className="flex items-start gap-3">
              <StickyNote size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-gray-900 whitespace-pre-wrap">{achat.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Montants */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Montants</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Montant HT</span>
            <span className="font-medium text-gray-900">{formatEuros(achat.montantHT)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">TVA ({achat.tauxTVA}%)</span>
            <span className="font-medium text-gray-900">{formatEuros(montantTVA)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-100">
            <span className="font-semibold text-gray-900 text-lg">Total TTC</span>
            <span className="font-bold text-gray-900 text-lg">{formatEuros(achat.montantTTC)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
