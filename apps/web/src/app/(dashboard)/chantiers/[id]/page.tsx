'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Trash2, Edit3, MapPin, Calendar, User, FileText, Receipt,
  ShoppingCart, Wallet, HardHat, TrendingUp, AlertCircle, CheckCircle2, Plus,
} from 'lucide-react';
import Link from 'next/link';

type ChantierDetail = {
  id: string;
  nom: string;
  statut: string;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  description: string | null;
  notes: string | null;
  budgetPrevu: string | null;
  client: { id: string; nom: string; prenom: string | null; entreprise: string | null; telephone: string; email: string | null } | null;
  devis: { id: string; numero: string; objet: string; statut: string; totalTTC: string; dateCreation: string }[];
  factures: { id: string; numero: string; type: string; statut: string; totalTTC: string; montantPaye: string; resteARegler: string; dateEmission: string }[];
  achats: { id: string; designation: string; categorie: string; montantTTC: string; date: string }[];
  frais: { id: string; description: string; categorie: string; montant: string; date: string }[];
  evenements: { id: string; titre: string; type: string; dateDebut: string; dateFin: string }[];
  totalFacture: number;
  totalEncaisse: number;
  totalAchats: number;
  totalFrais: number;
  totalCouts: number;
  marge: number;
};

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  GARANTIE: 'Garantie',
};

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: 'bg-gray-100 text-gray-600',
  EN_COURS: 'bg-blue-100 text-blue-700',
  TERMINE: 'bg-green-100 text-green-700',
  GARANTIE: 'bg-amber-100 text-amber-700',
};

function formatEuros(val: number | string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(val));
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ChantierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [chantier, setChantier] = useState<ChantierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [tab, setTab] = useState<'apercu' | 'devis' | 'factures' | 'depenses'>('apercu');

  useEffect(() => {
    fetch(`/api/chantiers/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(setChantier)
      .catch(() => router.push('/chantiers'))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function updateStatut(statut: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/chantiers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      });
      if (res.ok) {
        setChantier((prev) => prev ? { ...prev, statut } : prev);
      }
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce chantier ?')) return;
    await fetch(`/api/chantiers/${id}`, { method: 'DELETE' });
    router.push('/chantiers');
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

  if (!chantier) return null;

  const c = chantier;
  const clientName = c.client
    ? c.client.entreprise || `${c.client.nom} ${c.client.prenom || ''}`.trim()
    : null;
  const fullAddress = [c.adresse, c.codePostal, c.ville].filter(Boolean).join(', ');
  const budget = c.budgetPrevu ? Number(c.budgetPrevu) : null;
  const budgetUsedPct = budget && budget > 0 ? (c.totalCouts / budget) * 100 : null;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/chantiers" className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{c.nom}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_COLORS[c.statut]}`}>
                {STATUT_LABELS[c.statut]}
              </span>
            </div>
            {fullAddress && <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={14} /> {fullAddress}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="p-2 rounded-xl hover:bg-red-50 transition-colors">
            <Trash2 size={20} className="text-red-500" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">CA Facturé</p>
          <p className="text-xl font-bold text-gray-900">{formatEuros(c.totalFacture)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Encaissé</p>
          <p className="text-xl font-bold text-green-600">{formatEuros(c.totalEncaisse)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Coûts</p>
          <p className="text-xl font-bold text-gray-900">{formatEuros(c.totalCouts)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Achats {formatEuros(c.totalAchats)} · Frais {formatEuros(c.totalFrais)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Marge</p>
          <p className={`text-xl font-bold ${c.marge >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatEuros(c.marge)}
          </p>
          {c.totalFacture > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {((c.marge / c.totalFacture) * 100).toFixed(1)}% de marge
            </p>
          )}
        </div>
      </div>

      {/* Budget progress */}
      {budget && budget > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">Budget</span>
            <span className="text-sm font-medium text-gray-900">
              {formatEuros(c.totalCouts)} / {formatEuros(budget)}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${budgetUsedPct! > 100 ? 'bg-red-500' : budgetUsedPct! > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(budgetUsedPct!, 100)}%` }}
            />
          </div>
          {budgetUsedPct! > 100 && (
            <p className="text-sm text-red-600 font-medium mt-1">
              Budget dépassé de {formatEuros(c.totalCouts - budget)}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
            {(['apercu', 'devis', 'factures', 'depenses'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'apercu' ? 'Aperçu' : t === 'devis' ? `Devis (${c.devis.length})` : t === 'factures' ? `Factures (${c.factures.length})` : `Dépenses (${c.achats.length + c.frais.length})`}
              </button>
            ))}
          </div>

          {/* Tab: Apercu */}
          {tab === 'apercu' && (
            <div className="space-y-4">
              {c.description && (
                <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.description}</p>
                </div>
              )}
              {/* Recent activity */}
              <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activité récente</h2>
                {c.devis.length === 0 && c.factures.length === 0 && c.achats.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Aucune activité</p>
                ) : (
                  <div className="space-y-2">
                    {c.devis.slice(0, 3).map((d) => (
                      <Link key={d.id} href={`/devis/${d.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <FileText size={16} className="text-blue-500" />
                        <span className="text-sm text-gray-700 flex-1 truncate">{d.numero} — {d.objet}</span>
                        <span className="text-sm font-medium">{formatEuros(d.totalTTC)}</span>
                      </Link>
                    ))}
                    {c.factures.slice(0, 3).map((f) => (
                      <Link key={f.id} href={`/factures/${f.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <Receipt size={16} className="text-green-500" />
                        <span className="text-sm text-gray-700 flex-1 truncate">{f.numero}</span>
                        <span className="text-sm font-medium">{formatEuros(f.totalTTC)}</span>
                      </Link>
                    ))}
                    {c.achats.slice(0, 3).map((a) => (
                      <Link key={a.id} href={`/achats/${a.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <ShoppingCart size={16} className="text-orange-500" />
                        <span className="text-sm text-gray-700 flex-1 truncate">{a.designation}</span>
                        <span className="text-sm font-medium">{formatEuros(a.montantTTC)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Devis */}
          {tab === 'devis' && (
            <div className="space-y-2">
              {c.devis.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                  <FileText size={40} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-400">Aucun devis lié</p>
                </div>
              ) : c.devis.map((d) => (
                <Link key={d.id} href={`/devis/${d.id}`}
                  className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{d.numero}</p>
                      <p className="text-sm text-gray-500">{d.objet}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(d.dateCreation)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatEuros(d.totalTTC)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        d.statut === 'ACCEPTE' ? 'bg-green-100 text-green-700' :
                        d.statut === 'ENVOYE' ? 'bg-blue-100 text-blue-700' :
                        d.statut === 'REFUSE' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{d.statut}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Tab: Factures */}
          {tab === 'factures' && (
            <div className="space-y-2">
              {c.factures.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                  <Receipt size={40} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-400">Aucune facture liée</p>
                </div>
              ) : c.factures.map((f) => (
                <Link key={f.id} href={`/factures/${f.id}`}
                  className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{f.numero}</p>
                      <p className="text-xs text-gray-400">{formatDate(f.dateEmission)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatEuros(f.totalTTC)}</p>
                      {Number(f.resteARegler) > 0 && (
                        <p className="text-xs text-amber-600">Reste: {formatEuros(f.resteARegler)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Tab: Depenses */}
          {tab === 'depenses' && (
            <div className="space-y-4">
              {c.achats.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Achats ({c.achats.length}) — {formatEuros(c.totalAchats)}
                  </h3>
                  <div className="space-y-2">
                    {c.achats.map((a) => (
                      <Link key={a.id} href={`/achats/${a.id}`}
                        className="block bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{a.designation}</p>
                            <p className="text-xs text-gray-400">{formatDate(a.date)} · {a.categorie}</p>
                          </div>
                          <p className="font-semibold text-gray-900">{formatEuros(a.montantTTC)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {c.frais.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Frais ({c.frais.length}) — {formatEuros(c.totalFrais)}
                  </h3>
                  <div className="space-y-2">
                    {c.frais.map((f) => (
                      <div key={f.id} className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{f.description}</p>
                            <p className="text-xs text-gray-400">{formatDate(f.date)} · {f.categorie}</p>
                          </div>
                          <p className="font-semibold text-gray-900">{formatEuros(f.montant)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {c.achats.length === 0 && c.frais.length === 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                  <Wallet size={40} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-400">Aucune dépense liée</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Client */}
          {c.client && (
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Client</h2>
              <Link href={`/contacts/${c.client.id}`} className="flex items-start gap-3 group">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">{c.client.nom[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-blue-600">{clientName}</p>
                  <p className="text-sm text-gray-400">{c.client.telephone}</p>
                </div>
              </Link>
            </div>
          )}

          {/* Dates */}
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dates</h2>
            <div className="space-y-2 text-sm">
              {c.dateDebut && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-gray-500">Début</span>
                  <span className="ml-auto font-medium text-gray-900">{formatDate(c.dateDebut)}</span>
                </div>
              )}
              {c.dateFin && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-gray-500">Fin prévue</span>
                  <span className="ml-auto font-medium text-gray-900">{formatDate(c.dateFin)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Actions</h2>
            <div className="space-y-2">
              {c.statut === 'EN_ATTENTE' && (
                <button onClick={() => updateStatut('EN_COURS')} disabled={updating}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-blue-50 text-blue-700
                             hover:bg-blue-100 transition-colors min-h-[48px] disabled:opacity-50">
                  <HardHat size={20} />
                  <span className="font-medium">Démarrer le chantier</span>
                </button>
              )}
              {c.statut === 'EN_COURS' && (
                <button onClick={() => updateStatut('TERMINE')} disabled={updating}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-green-50 text-green-700
                             hover:bg-green-100 transition-colors min-h-[48px] disabled:opacity-50">
                  <CheckCircle2 size={20} />
                  <span className="font-medium">Terminer le chantier</span>
                </button>
              )}
              {c.statut === 'TERMINE' && (
                <button onClick={() => updateStatut('GARANTIE')} disabled={updating}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-amber-50 text-amber-700
                             hover:bg-amber-100 transition-colors min-h-[48px] disabled:opacity-50">
                  <AlertCircle size={20} />
                  <span className="font-medium">Passer en garantie</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick-create links */}
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Créer</h2>
            <div className="space-y-2">
              <Link href={`/devis/nouveau?chantierId=${c.id}${c.client ? `&contactId=${c.client.id}` : ''}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[48px]">
                <Plus size={18} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Nouveau devis</span>
              </Link>
              <Link href={`/factures/nouvelle?chantierId=${c.id}${c.client ? `&contactId=${c.client.id}` : ''}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[48px]">
                <Plus size={18} className="text-green-600" />
                <span className="text-sm font-medium text-gray-700">Nouvelle facture</span>
              </Link>
              <Link href={`/achats/nouveau?chantierId=${c.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[48px]">
                <Plus size={18} className="text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Nouvel achat</span>
              </Link>
              <Link href={`/frais/nouveau?chantierId=${c.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[48px]">
                <Plus size={18} className="text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Nouveau frais</span>
              </Link>
            </div>
          </div>

          {/* Notes */}
          {c.notes && (
            <div className="bg-amber-50 rounded-2xl p-4 lg:p-6">
              <h2 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Notes</h2>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">{c.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
