'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Edit3, Trash2, Send, CheckCircle2, XCircle, Copy, Receipt,
  Clock, AlertTriangle, FileText, User, Calendar, MapPin,
} from 'lucide-react';
import Link from 'next/link';

type DevisLigne = {
  id: string;
  designation: string;
  description: string | null;
  quantite: string;
  unite: string;
  prixUnitaireHT: string;
  tauxTVA: string;
  totalHT: string;
  lot: string | null;
  ordre: number;
};

type DevisDetail = {
  id: string;
  numero: string;
  objet: string;
  statut: string;
  dateCreation: string;
  dateValidite: string;
  totalHT: string;
  totalTVA: string;
  totalTTC: string;
  remise: string | null;
  conditions: string | null;
  notes: string | null;
  contact: {
    id: string;
    nom: string;
    prenom: string | null;
    entreprise: string | null;
    telephone: string;
    email: string | null;
    adresse: string | null;
    codePostal: string | null;
    ville: string | null;
  };
  lignes: DevisLigne[];
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
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function DevisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [devis, setDevis] = useState<DevisDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/devis/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(setDevis)
      .catch(() => router.push('/devis'))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function updateStatut(statut: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/devis/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDevis(updated);
      }
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce devis ?')) return;
    await fetch(`/api/devis/${id}`, { method: 'DELETE' });
    router.push('/devis');
  }

  async function handleDuplicate() {
    if (!devis) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: devis.contact.id,
          objet: `${devis.objet} (copie)`,
          conditions: devis.conditions,
          notes: devis.notes,
          lignes: devis.lignes.map((l) => ({
            designation: l.designation,
            description: l.description,
            quantite: Number(l.quantite),
            unite: l.unite,
            prixUnitaireHT: Number(l.prixUnitaireHT),
            tauxTVA: Number(l.tauxTVA),
            lot: l.lot,
          })),
        }),
      });
      if (res.ok) {
        const newDevis = await res.json();
        router.push(`/devis/${newDevis.id}`);
      }
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-5xl">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-24 bg-gray-200 rounded-2xl" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!devis) return null;

  const StatutIcon = STATUT_ICONS[devis.statut] || Clock;
  const contact = devis.contact;
  const contactName = `${contact.nom}${contact.prenom ? ` ${contact.prenom}` : ''}`;
  const contactAddress = [contact.adresse, contact.codePostal, contact.ville].filter(Boolean).join(', ');

  // Detail TVA par taux
  const tvaDetails: Record<string, { base: number; tva: number }> = {};
  devis.lignes.forEach((l) => {
    const taux = l.tauxTVA;
    if (!tvaDetails[taux]) tvaDetails[taux] = { base: 0, tva: 0 };
    tvaDetails[taux].base += Number(l.totalHT);
    tvaDetails[taux].tva += Number(l.totalHT) * Number(l.tauxTVA) / 100;
  });

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/devis"
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Retour">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{devis.numero}</h1>
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_COLORS[devis.statut]}`}>
                <StatutIcon size={14} />
                {STATUT_LABELS[devis.statut]}
              </span>
            </div>
            <p className="text-sm text-gray-500">{devis.objet}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {devis.statut === 'BROUILLON' && (
            <button onClick={() => router.push(`/devis/${id}/modifier`)}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200
                         text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Edit3 size={16} /> Modifier
            </button>
          )}
          {devis.statut === 'BROUILLON' && (
            <button onClick={() => router.push(`/devis/${id}/modifier`)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200"
              aria-label="Modifier">
              <Edit3 size={20} className="text-gray-600" />
            </button>
          )}
          <button onClick={handleDelete}
            className="p-2 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors"
            aria-label="Supprimer">
            <Trash2 size={20} className="text-red-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-4">

          {/* Client */}
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Client</h2>
            <Link href={`/contacts/${contact.id}`} className="flex items-start gap-3 group">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">{contact.nom[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{contactName}</p>
                {contact.entreprise && <p className="text-sm text-gray-500">{contact.entreprise}</p>}
                {contactAddress && <p className="text-sm text-gray-400">{contactAddress}</p>}
              </div>
            </Link>
          </div>

          {/* Lignes du devis */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 lg:p-6 pb-0">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Prestations ({devis.lignes.length} ligne{devis.lignes.length > 1 ? 's' : ''})
              </h2>
            </div>

            {/* Version desktop — tableau */}
            <div className="hidden lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-400 px-6 py-2">Designation</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-4 py-2">Qte</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-2 py-2">Unite</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-4 py-2">PU HT</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-4 py-2">TVA</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-6 py-2">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {devis.lignes.map((l) => (
                    <tr key={l.id}>
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-gray-900">{l.designation}</p>
                        {l.description && <p className="text-xs text-gray-400 mt-0.5">{l.description}</p>}
                      </td>
                      <td className="text-right px-4 py-3 text-sm text-gray-600">{Number(l.quantite)}</td>
                      <td className="px-2 py-3 text-sm text-gray-400">{l.unite}</td>
                      <td className="text-right px-4 py-3 text-sm text-gray-600">{formatEuros(l.prixUnitaireHT)}</td>
                      <td className="text-right px-4 py-3 text-sm text-gray-400">{Number(l.tauxTVA)}%</td>
                      <td className="text-right px-6 py-3 text-sm font-medium text-gray-900">{formatEuros(l.totalHT)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Version mobile — cartes */}
            <div className="lg:hidden divide-y divide-gray-50">
              {devis.lignes.map((l) => (
                <div key={l.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{l.designation}</p>
                      {l.description && <p className="text-xs text-gray-400 mt-0.5">{l.description}</p>}
                      <p className="text-sm text-gray-500 mt-1">
                        {Number(l.quantite)} {l.unite} × {formatEuros(l.prixUnitaireHT)}
                        <span className="text-gray-400 ml-1">(TVA {Number(l.tauxTVA)}%)</span>
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 ml-3">{formatEuros(l.totalHT)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totaux */}
            <div className="border-t border-gray-100 p-4 lg:p-6 bg-gray-50/50">
              <div className="max-w-xs ml-auto space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total HT</span>
                  <span className="font-medium">{formatEuros(devis.totalHT)}</span>
                </div>
                {Object.entries(tvaDetails)
                  .filter(([, v]) => v.tva > 0)
                  .map(([taux, v]) => (
                    <div key={taux} className="flex justify-between text-sm">
                      <span className="text-gray-400">TVA {Number(taux)}%</span>
                      <span className="text-gray-600">{formatEuros(v.tva)}</span>
                    </div>
                  ))}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total TVA</span>
                  <span className="font-medium">{formatEuros(devis.totalTVA)}</span>
                </div>
                {devis.remise && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Remise</span>
                    <span className="text-red-600">-{formatEuros(devis.remise)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total TTC</span>
                  <span className="text-xl font-bold text-blue-600">{formatEuros(devis.totalTTC)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conditions */}
          {devis.conditions && (
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Conditions</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{devis.conditions}</p>
            </div>
          )}

          {/* Notes internes */}
          {devis.notes && (
            <div className="bg-amber-50 rounded-2xl p-4 lg:p-6">
              <h2 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Notes internes</h2>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">{devis.notes}</p>
            </div>
          )}
        </div>

        {/* Colonne droite — Actions */}
        <div className="space-y-4">

          {/* Dates */}
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dates</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-gray-500">Cree le</span>
                <span className="font-medium text-gray-900 ml-auto">{formatDate(devis.dateCreation)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-gray-400" />
                <span className="text-gray-500">Valide jusqu'au</span>
                <span className="font-medium text-gray-900 ml-auto">{formatDate(devis.dateValidite)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Actions</h2>
            <div className="space-y-2">
              {/* Changer le statut */}
              {devis.statut === 'BROUILLON' && (
                <button onClick={() => updateStatut('ENVOYE')} disabled={updating}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-blue-50 text-blue-700
                             hover:bg-blue-100 active:bg-blue-200 transition-colors min-h-[48px]
                             disabled:opacity-50">
                  <Send size={20} />
                  <span className="font-medium">Marquer comme envoyé</span>
                </button>
              )}
              {devis.statut === 'ENVOYE' && (
                <>
                  <button onClick={() => updateStatut('ACCEPTE')} disabled={updating}
                    className="flex items-center gap-3 w-full p-3 rounded-xl bg-green-50 text-green-700
                               hover:bg-green-100 active:bg-green-200 transition-colors min-h-[48px]
                               disabled:opacity-50">
                    <CheckCircle2 size={20} />
                    <span className="font-medium">Accepté par le client</span>
                  </button>
                  <button onClick={() => updateStatut('REFUSE')} disabled={updating}
                    className="flex items-center gap-3 w-full p-3 rounded-xl bg-red-50 text-red-700
                               hover:bg-red-100 active:bg-red-200 transition-colors min-h-[48px]
                               disabled:opacity-50">
                    <XCircle size={20} />
                    <span className="font-medium">Refusé par le client</span>
                  </button>
                </>
              )}

              {/* Dupliquer */}
              <button onClick={handleDuplicate} disabled={updating}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50
                           active:bg-gray-100 transition-colors min-h-[48px] disabled:opacity-50">
                <Copy size={20} className="text-gray-500" />
                <span className="font-medium text-gray-700">Dupliquer ce devis</span>
              </button>

              {/* Transformer en facture */}
              {devis.statut === 'ACCEPTE' && (
                <button disabled
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-green-50 text-green-700
                             hover:bg-green-100 transition-colors min-h-[48px] opacity-60">
                  <Receipt size={20} />
                  <span className="font-medium">Transformer en facture</span>
                  <span className="text-xs ml-auto">(bientôt)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
