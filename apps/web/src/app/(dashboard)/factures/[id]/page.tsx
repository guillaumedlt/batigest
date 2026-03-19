'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Trash2, Send, CheckCircle2, Ban, CreditCard,
  Clock, AlertCircle, Receipt, Calendar, FileText, Plus, Eye, MapPin,
} from 'lucide-react';
import Link from 'next/link';

type FactureLigne = {
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

type Paiement = {
  id: string;
  montant: string;
  date: string;
  mode: string;
  reference: string | null;
  notes: string | null;
};

type FactureDetail = {
  id: string;
  numero: string;
  type: string;
  statut: string;
  dateEmission: string;
  dateEcheance: string;
  totalHT: string;
  totalTVA: string;
  totalTTC: string;
  montantPaye: string;
  resteARegler: string;
  conditions: string | null;
  notes: string | null;
  contact: {
    id: string;
    nom: string;
    prenom: string | null;
    entreprise: string | null;
    telephone: string;
    email: string | null;
  };
  chantier: { id: string; nom: string } | null;
  devis: { id: string; numero: string; objet: string } | null;
  lignes: FactureLigne[];
  paiements: Paiement[];
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

const MODE_LABELS: Record<string, string> = {
  virement: 'Virement',
  cheque: 'Chèque',
  especes: 'Espèces',
  cb: 'Carte bancaire',
};

function formatEuros(value: string | number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function FactureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [facture, setFacture] = useState<FactureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPaiement, setShowPaiement] = useState(false);
  const [paiementForm, setPaiementForm] = useState({
    montant: '',
    date: new Date().toISOString().slice(0, 10),
    mode: 'virement',
    reference: '',
  });

  useEffect(() => {
    fetchFacture();
  }, [id]);

  async function fetchFacture() {
    try {
      const res = await fetch(`/api/factures/${id}`);
      if (!res.ok) throw new Error('Not found');
      setFacture(await res.json());
    } catch {
      router.push('/factures');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatut(statut: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/factures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      });
      if (res.ok) setFacture(await res.json());
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer cette facture ?')) return;
    await fetch(`/api/factures/${id}`, { method: 'DELETE' });
    router.push('/factures');
  }

  async function handlePaiement() {
    if (!paiementForm.montant || parseFloat(paiementForm.montant) <= 0) {
      alert('Entrez un montant valide.');
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/factures/${id}/paiements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paiementForm),
      });
      if (res.ok) {
        setShowPaiement(false);
        setPaiementForm({ montant: '', date: new Date().toISOString().slice(0, 10), mode: 'virement', reference: '' });
        await fetchFacture();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur');
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

  if (!facture) return null;

  const contact = facture.contact;
  const contactName = `${contact.nom}${contact.prenom ? ` ${contact.prenom}` : ''}`;
  const overdue = facture.statut === 'EMISE' && new Date(facture.dateEcheance) < new Date();
  const paidPercent = facture.totalTTC !== '0' ? (Number(facture.montantPaye) / Number(facture.totalTTC)) * 100 : 0;

  // TVA par taux
  const tvaDetails: Record<string, { base: number; tva: number }> = {};
  facture.lignes.forEach((l) => {
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
          <Link href="/factures"
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Retour">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{facture.numero}</h1>
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_COLORS[facture.statut]}`}>
                {STATUT_LABELS[facture.statut]}
              </span>
              {overdue && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">En retard</span>
              )}
            </div>
            {facture.devis && (
              <Link href={`/devis/${facture.devis.id}`} className="text-sm text-blue-600 hover:underline">
                Devis {facture.devis.numero} — {facture.devis.objet}
              </Link>
            )}
          </div>
        </div>
        {(facture.statut === 'BROUILLON' || facture.statut === 'ANNULEE') && (
          <button onClick={handleDelete}
            className="p-2 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors"
            aria-label="Supprimer">
            <Trash2 size={20} className="text-red-500" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Colonne principale */}
        <div className="md:col-span-2 space-y-4">

          {/* Barre de progression paiement */}
          {facture.statut !== 'BROUILLON' && facture.statut !== 'ANNULEE' && (
            <div className="bg-white rounded-2xl p-4 md:p-5 lg:p-6 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">Paiement</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatEuros(facture.montantPaye)} / {formatEuros(facture.totalTTC)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${paidPercent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(paidPercent, 100)}%` }}
                />
              </div>
              {Number(facture.resteARegler) > 0 && (
                <p className={`text-sm mt-2 ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  Reste a regler : {formatEuros(facture.resteARegler)}
                  {overdue && ' — Echeance depassée'}
                </p>
              )}
            </div>
          )}

          {/* Client */}
          <div className="bg-white rounded-2xl p-4 md:p-5 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Client</h2>
            <Link href={`/contacts/${contact.id}`} className="flex items-start gap-3 group">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">{contact.nom[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{contactName}</p>
                {contact.entreprise && <p className="text-sm text-gray-500">{contact.entreprise}</p>}
              </div>
            </Link>
          </div>

          {/* Chantier */}
          {facture.chantier && (
            <div className="bg-white rounded-2xl p-4 md:p-5 lg:p-6 shadow-sm">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chantier</h2>
              <Link href={`/chantiers/${facture.chantier.id}`} className="flex items-center gap-2 group">
                <MapPin size={16} className="text-gray-400" />
                <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {facture.chantier.nom}
                </span>
              </Link>
            </div>
          )}

          {/* Lignes */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 lg:p-6 pb-0">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Lignes ({facture.lignes.length})
              </h2>
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-400 px-6 py-2">Designation</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-3 py-2 whitespace-nowrap w-16">Qte</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-2 py-2 w-14">Unite</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-3 py-2 whitespace-nowrap w-24">PU HT</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-3 py-2 whitespace-nowrap w-16">TVA</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-6 py-2 whitespace-nowrap w-28">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {facture.lignes.map((l) => (
                    <tr key={l.id}>
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-gray-900">{l.designation}</p>
                        {l.description && <p className="text-xs text-gray-400">{l.description}</p>}
                      </td>
                      <td className="text-right px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{Number(l.quantite)}</td>
                      <td className="px-2 py-3 text-sm text-gray-400 whitespace-nowrap">{l.unite}</td>
                      <td className="text-right px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{formatEuros(l.prixUnitaireHT)}</td>
                      <td className="text-right px-3 py-3 text-sm text-gray-400 whitespace-nowrap">{Number(l.tauxTVA)}%</td>
                      <td className="text-right px-6 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{formatEuros(l.totalHT)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-50">
              {facture.lignes.map((l) => (
                <div key={l.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{l.designation}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {Number(l.quantite)} {l.unite} × {formatEuros(l.prixUnitaireHT)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 ml-3">{formatEuros(l.totalHT)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totaux */}
            <div className="border-t border-gray-100 p-4 md:p-5 lg:p-6 bg-gray-50/50">
              <div className="max-w-xs ml-auto space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total HT</span>
                  <span className="font-medium">{formatEuros(facture.totalHT)}</span>
                </div>
                {Object.entries(tvaDetails).filter(([, v]) => v.tva > 0).map(([taux, v]) => (
                  <div key={taux} className="flex justify-between text-sm">
                    <span className="text-gray-400">TVA {Number(taux)}%</span>
                    <span className="text-gray-600">{formatEuros(v.tva)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total TTC</span>
                  <span className="text-xl font-bold text-blue-600">{formatEuros(facture.totalTTC)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Historique des paiements */}
          {facture.paiements.length > 0 && (
            <div className="bg-white rounded-2xl p-4 md:p-5 lg:p-6 shadow-sm">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Paiements ({facture.paiements.length})
              </h2>
              <div className="space-y-2">
                {facture.paiements.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CreditCard size={18} className="text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {MODE_LABELS[p.mode] || p.mode}
                          {p.reference && <span className="text-gray-400 ml-2">ref. {p.reference}</span>}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(p.date)}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-700">{formatEuros(p.montant)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditions */}
          {facture.conditions && (
            <div className="bg-white rounded-2xl p-4 md:p-5 lg:p-6 shadow-sm">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Conditions</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{facture.conditions}</p>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">

          {/* Dates */}
          <div className="bg-white rounded-2xl p-4 md:p-5 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dates</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-gray-500">Emise le</span>
                <span className="font-medium text-gray-900 ml-auto">{formatDate(facture.dateEmission)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className={overdue ? 'text-red-500' : 'text-gray-400'} />
                <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-500'}>Echeance</span>
                <span className={`font-medium ml-auto ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(facture.dateEcheance)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl p-4 md:p-5 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Actions</h2>
            <div className="space-y-2">
              {facture.statut === 'BROUILLON' && (
                <button onClick={() => updateStatut('EMISE')} disabled={updating}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-blue-50 text-blue-700
                             hover:bg-blue-100 active:bg-blue-200 transition-colors min-h-[48px]
                             disabled:opacity-50">
                  <Send size={20} />
                  <span className="font-medium">Emettre la facture</span>
                </button>
              )}

              {(facture.statut === 'EMISE' || facture.statut === 'PAYEE_PARTIELLEMENT') && (
                <button onClick={() => setShowPaiement(!showPaiement)}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-green-50 text-green-700
                             hover:bg-green-100 active:bg-green-200 transition-colors min-h-[48px]">
                  <CreditCard size={20} />
                  <span className="font-medium">Enregistrer un paiement</span>
                </button>
              )}

              {/* Aperçu PDF */}
              <button onClick={() => router.push(`/factures/${id}/apercu`)}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50
                           active:bg-gray-100 transition-colors min-h-[48px]">
                <Eye size={20} className="text-gray-500" />
                <span className="font-medium text-gray-700">Aperçu / PDF</span>
              </button>

              {/* Factur-X XML */}
              {facture.statut !== 'BROUILLON' && (
                <a href={`/api/factures/${id}/facturx`} download
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-purple-50
                             active:bg-purple-100 transition-colors min-h-[48px]">
                  <FileText size={20} className="text-purple-500" />
                  <span className="font-medium text-purple-700">Factur-X (XML)</span>
                </a>
              )}

              {facture.statut !== 'ANNULEE' && facture.statut !== 'BROUILLON' && (
                <button onClick={() => updateStatut('ANNULEE')} disabled={updating}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50
                             active:bg-red-100 transition-colors min-h-[48px] disabled:opacity-50">
                  <Ban size={20} className="text-red-500" />
                  <span className="font-medium text-red-600">Annuler</span>
                </button>
              )}

              {facture.statut === 'ANNULEE' && (
                <button onClick={handleDelete} disabled={updating}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50
                             active:bg-red-100 transition-colors min-h-[48px] disabled:opacity-50">
                  <Trash2 size={20} className="text-red-500" />
                  <span className="font-medium text-red-600">Supprimer</span>
                </button>
              )}
            </div>
          </div>

          {/* Formulaire paiement */}
          {showPaiement && (
            <div className="bg-white rounded-2xl p-4 md:p-5 lg:p-6 shadow-sm border-2 border-green-200">
              <h2 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">Nouveau paiement</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Montant</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={Number(facture.resteARegler)}
                    value={paiementForm.montant}
                    onChange={(e) => setPaiementForm({ ...paiementForm, montant: e.target.value })}
                    placeholder={`Max : ${formatEuros(facture.resteARegler)}`}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base
                               focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={paiementForm.date}
                    onChange={(e) => setPaiementForm({ ...paiementForm, date: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base
                               focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Mode</label>
                  <select
                    value={paiementForm.mode}
                    onChange={(e) => setPaiementForm({ ...paiementForm, mode: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base bg-white
                               focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="virement">Virement</option>
                    <option value="cheque">Chèque</option>
                    <option value="especes">Espèces</option>
                    <option value="cb">Carte bancaire</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Reference (optionnel)</label>
                  <input
                    type="text"
                    value={paiementForm.reference}
                    onChange={(e) => setPaiementForm({ ...paiementForm, reference: e.target.value })}
                    placeholder="N° de chèque, ref virement..."
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm
                               focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <button onClick={handlePaiement} disabled={updating}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white
                             px-4 py-3 rounded-xl font-semibold text-base active:scale-95
                             transition-transform min-h-[48px] disabled:opacity-50">
                  <CheckCircle2 size={18} />
                  {updating ? 'Enregistrement...' : 'Valider le paiement'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
