'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

type Contact = {
  id: string;
  nom: string;
  prenom: string | null;
  entreprise: string | null;
};

type ChantierOption = {
  id: string;
  nom: string;
};

type LigneFacture = {
  id: string;
  designation: string;
  description: string;
  quantite: string;
  unite: string;
  prixUnitaireHT: string;
  tauxTVA: string;
};

const UNITES = ['u', 'h', 'm', 'm\u00B2', 'm\u00B3', 'ml', 'kg', 'l', 'forfait', 'lot', 'ens.'];
const TAUX_TVA = ['20', '10', '5.5', '0'];

function newLigne(): LigneFacture {
  return {
    id: crypto.randomUUID(),
    designation: '',
    description: '',
    quantite: '1',
    unite: 'u',
    prixUnitaireHT: '',
    tauxTVA: '20',
  };
}

function calcLigneHT(l: LigneFacture): number {
  return (parseFloat(l.quantite) || 0) * (parseFloat(l.prixUnitaireHT) || 0);
}

function calcLigneTVA(l: LigneFacture): number {
  return calcLigneHT(l) * (parseFloat(l.tauxTVA) || 0) / 100;
}

function formatEuros(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export default function ModifierFacturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [chantiers, setChantiers] = useState<ChantierOption[]>([]);
  const [contactId, setContactId] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [chantierId, setChantierId] = useState('');
  const [factureType, setFactureType] = useState('CLASSIQUE');
  const [statut, setStatut] = useState('BROUILLON');
  const [numero, setNumero] = useState('');
  const [dateEcheance, setDateEcheance] = useState('');
  const [conditions, setConditions] = useState('');
  const [notes, setNotes] = useState('');
  const [lignes, setLignes] = useState<LigneFacture[]>([newLigne()]);
  const [saving, setSaving] = useState(false);

  // Charger la facture existante + contacts + chantiers
  useEffect(() => {
    Promise.all([
      fetch(`/api/factures/${id}`).then((r) => r.json()),
      fetch('/api/contacts').then((r) => r.json()),
      fetch('/api/chantiers').then((r) => r.json()),
    ]).then(([facture, allContacts, allChantiers]) => {
      setContacts(allContacts);
      setChantiers(allChantiers);
      setContactId(facture.contactId || facture.contact?.id || '');
      setChantierId(facture.chantierId || facture.chantier?.id || '');
      setFactureType(facture.type);
      setStatut(facture.statut);
      setNumero(facture.numero);
      setDateEcheance(new Date(facture.dateEcheance).toISOString().slice(0, 10));
      setConditions(facture.conditions || '');
      setNotes(facture.notes || '');
      setLignes(
        facture.lignes.map((l: { id: string; designation: string; description: string | null; quantite: string; unite: string; prixUnitaireHT: string; tauxTVA: string }) => ({
          id: l.id,
          designation: l.designation,
          description: l.description || '',
          quantite: String(Number(l.quantite)),
          unite: l.unite,
          prixUnitaireHT: String(Number(l.prixUnitaireHT)),
          tauxTVA: String(Number(l.tauxTVA)),
        }))
      );
      setLoading(false);
    }).catch(() => router.push('/factures'));
  }, [id, router]);

  const selectedContact = contacts.find((c) => c.id === contactId);
  const filteredContacts = contacts.filter((c) => {
    const term = contactSearch.toLowerCase();
    return (
      c.nom.toLowerCase().includes(term) ||
      (c.prenom && c.prenom.toLowerCase().includes(term)) ||
      (c.entreprise && c.entreprise.toLowerCase().includes(term))
    );
  });

  const totalHT = lignes.reduce((sum, l) => sum + calcLigneHT(l), 0);
  const totalTVA = lignes.reduce((sum, l) => sum + calcLigneTVA(l), 0);
  const totalTTC = totalHT + totalTVA;

  const tvaDetails: Record<string, { base: number; tva: number }> = {};
  lignes.forEach((l) => {
    const taux = l.tauxTVA || '0';
    if (!tvaDetails[taux]) tvaDetails[taux] = { base: 0, tva: 0 };
    tvaDetails[taux].base += calcLigneHT(l);
    tvaDetails[taux].tva += calcLigneTVA(l);
  });

  const updateLigne = useCallback((lineId: string, field: keyof LigneFacture, value: string) => {
    setLignes((prev) => prev.map((l) => (l.id === lineId ? { ...l, [field]: value } : l)));
  }, []);

  function addLigne() {
    setLignes((prev) => [...prev, newLigne()]);
  }

  function removeLigne(ligneId: string) {
    setLignes((prev) => prev.length > 1 ? prev.filter((l) => l.id !== ligneId) : prev);
  }

  const isEditable = statut === 'BROUILLON';

  async function handleSave() {
    if (!isEditable) return;
    if (!contactId) { alert('Selectionnez un client.'); return; }
    const validLignes = lignes.filter((l) => l.designation.trim() && parseFloat(l.prixUnitaireHT) > 0);
    if (validLignes.length === 0) { alert('Ajoutez au moins une ligne.'); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/factures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          chantierId: chantierId || null,
          type: factureType,
          dateEcheance,
          conditions: conditions || null,
          notes: notes || null,
          lignes: validLignes.map((l) => ({
            designation: l.designation,
            description: l.description || null,
            quantite: parseFloat(l.quantite) || 1,
            unite: l.unite,
            prixUnitaireHT: parseFloat(l.prixUnitaireHT) || 0,
            tauxTVA: parseFloat(l.tauxTVA) || 0,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la modification.');
        return;
      }

      router.push(`/factures/${id}`);
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Avertissement si non editable */}
      {!isEditable && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">
            Cette facture a le statut <strong>{statut.replace('_', ' ')}</strong> et ne peut plus etre modifiee.
            Seuls les brouillons sont editables.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/factures/${id}`}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Retour">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Modifier {numero}</h1>
          </div>
        </div>
        {isEditable && (
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl
                       font-semibold text-sm active:scale-95 transition-transform min-h-[44px]
                       disabled:opacity-50">
            <Save size={18} />
            <span className="hidden lg:inline">{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4">

          {/* Type de facture */}
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Type de facture</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { value: 'CLASSIQUE', label: 'Classique' },
                { value: 'ACOMPTE', label: 'Acompte' },
                { value: 'SITUATION', label: 'Situation' },
                { value: 'AVOIR', label: 'Avoir' },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => isEditable && setFactureType(t.value)}
                  disabled={!isEditable}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px]
                    ${factureType === t.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}
                    ${!isEditable ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Client */}
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Client</h2>
            <div className="relative">
              {selectedContact ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedContact.nom}{selectedContact.prenom ? ` ${selectedContact.prenom}` : ''}
                    </p>
                    {selectedContact.entreprise && <p className="text-sm text-gray-500">{selectedContact.entreprise}</p>}
                  </div>
                  {isEditable && (
                    <button onClick={() => { setContactId(''); setContactSearch(''); }}
                      className="text-sm text-blue-600 font-medium hover:text-blue-800 min-h-[44px] px-3">
                      Changer
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => { setContactSearch(e.target.value); setShowContactDropdown(true); }}
                    onFocus={() => setShowContactDropdown(true)}
                    placeholder="Rechercher un client..."
                    disabled={!isEditable}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {showContactDropdown && filteredContacts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredContacts.map((c) => (
                        <button key={c.id}
                          onClick={() => { setContactId(c.id); setShowContactDropdown(false); setContactSearch(''); }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors
                                     border-b border-gray-50 last:border-0 min-h-[48px]">
                          <p className="font-medium text-gray-900">
                            {c.nom}{c.prenom ? ` ${c.prenom}` : ''}
                          </p>
                          {c.entreprise && <p className="text-sm text-gray-500">{c.entreprise}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chantier */}
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chantier (optionnel)</h2>
            <select
              value={chantierId}
              onChange={(e) => setChantierId(e.target.value)}
              disabled={!isEditable}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">Aucun chantier</option>
              {chantiers.map((ch) => (
                <option key={ch.id} value={ch.id}>{ch.nom}</option>
              ))}
            </select>
          </div>

          {/* Lignes */}
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Prestations</h2>
              <span className="text-xs text-gray-400">{lignes.length} ligne{lignes.length > 1 ? 's' : ''}</span>
            </div>

            <div className="space-y-3">
              {lignes.map((ligne, index) => (
                <LigneForm
                  key={ligne.id}
                  ligne={ligne}
                  index={index}
                  onUpdate={updateLigne}
                  onRemove={() => removeLigne(ligne.id)}
                  canRemove={lignes.length > 1}
                  disabled={!isEditable}
                />
              ))}
            </div>

            {isEditable && (
              <button onClick={addLigne}
                className="mt-3 flex items-center gap-2 w-full justify-center p-3 rounded-xl border-2 border-dashed
                           border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600
                           active:bg-blue-50 transition-colors min-h-[48px] font-medium text-sm">
                <Plus size={18} />
                Ajouter une ligne
              </button>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm lg:sticky lg:top-20">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recapitulatif</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total HT</span>
                <span className="font-medium">{formatEuros(totalHT)}</span>
              </div>
              {Object.entries(tvaDetails).filter(([, v]) => v.tva > 0).map(([taux, v]) => (
                <div key={taux} className="flex justify-between text-sm">
                  <span className="text-gray-400">TVA {taux}%</span>
                  <span className="text-gray-600">{formatEuros(v.tva)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total TTC</span>
                  <span className="text-xl font-bold text-blue-600">{formatEuros(totalTTC)}</span>
                </div>
              </div>
            </div>

            {isEditable && (
              <button onClick={handleSave} disabled={saving}
                className="lg:hidden mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 text-white
                           px-4 py-3 rounded-xl font-semibold min-h-[48px] disabled:opacity-50">
                <Save size={18} />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Echeance</h2>
            <input type="date" value={dateEcheance}
              onChange={(e) => setDateEcheance(e.target.value)}
              disabled={!isEditable}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base focus:ring-2 focus:ring-blue-500
                         disabled:opacity-60 disabled:cursor-not-allowed" />
          </div>

          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Conditions</h2>
            <textarea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={3}
              disabled={!isEditable}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 resize-none
                         disabled:opacity-60 disabled:cursor-not-allowed" />
          </div>

          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Notes internes</h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Notes visibles uniquement par vous..."
              disabled={!isEditable}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 resize-none
                         disabled:opacity-60 disabled:cursor-not-allowed" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LigneForm({
  ligne,
  index,
  onUpdate,
  onRemove,
  canRemove,
  disabled,
}: {
  ligne: LigneFacture;
  index: number;
  onUpdate: (id: string, field: keyof LigneFacture, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled: boolean;
}) {
  const ht = calcLigneHT(ligne);

  return (
    <div className="border border-gray-100 rounded-xl p-3 lg:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-gray-300" />
          <span className="text-xs font-medium text-gray-400">Ligne {index + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{formatEuros(ht)}</span>
          {canRemove && !disabled && (
            <button onClick={onRemove}
              className="p-2 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors"
              aria-label="Supprimer la ligne">
              <Trash2 size={16} className="text-red-400" />
            </button>
          )}
        </div>
      </div>

      <input
        type="text"
        value={ligne.designation}
        onChange={(e) => onUpdate(ligne.id, 'designation', e.target.value)}
        placeholder="Designation"
        disabled={disabled}
        className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   disabled:opacity-60 disabled:cursor-not-allowed"
      />

      <input
        type="text"
        value={ligne.description}
        onChange={(e) => onUpdate(ligne.id, 'description', e.target.value)}
        placeholder="Description (optionnel)"
        disabled={disabled}
        className="w-full h-10 px-3 rounded-xl border border-gray-100 text-sm text-gray-500
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   disabled:opacity-60 disabled:cursor-not-allowed"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Quantite</label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={ligne.quantite}
            onChange={(e) => onUpdate(ligne.id, 'quantite', e.target.value)}
            disabled={disabled}
            className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Unite</label>
          <select
            value={ligne.unite}
            onChange={(e) => onUpdate(ligne.id, 'unite', e.target.value)}
            disabled={disabled}
            className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm bg-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Prix unitaire HT</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={ligne.prixUnitaireHT}
            onChange={(e) => onUpdate(ligne.id, 'prixUnitaireHT', e.target.value)}
            placeholder="0.00"
            disabled={disabled}
            className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">TVA</label>
          <select
            value={ligne.tauxTVA}
            onChange={(e) => onUpdate(ligne.id, 'tauxTVA', e.target.value)}
            disabled={disabled}
            className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm bg-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {TAUX_TVA.map((t) => <option key={t} value={t}>{t}%</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
