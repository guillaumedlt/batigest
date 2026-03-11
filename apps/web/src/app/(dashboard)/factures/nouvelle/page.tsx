'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save,
} from 'lucide-react';
import Link from 'next/link';

// Wrapper pour Suspense (useSearchParams necessite un Suspense boundary)
export default function NouvelleFacturePageWrapper() {
  return (
    <Suspense fallback={
      <div className="space-y-4 animate-pulse max-w-5xl">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-24 bg-gray-200 rounded-2xl" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
      </div>
    }>
      <NouvelleFacturePage />
    </Suspense>
  );
}

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

const UNITES = ['u', 'h', 'm', 'm²', 'm³', 'ml', 'kg', 'l', 'forfait', 'lot', 'ens.'];
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

function NouvelleFacturePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const devisId = searchParams.get('devisId');

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState(searchParams.get('contactId') || '');
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [chantiers, setChantiers] = useState<ChantierOption[]>([]);
  const [chantierId, setChantierId] = useState(searchParams.get('chantierId') || '');
  const [factureType, setFactureType] = useState('CLASSIQUE');
  const [dateEcheance, setDateEcheance] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [conditions, setConditions] = useState('Reglement a 30 jours. Penalites de retard : 3x le taux legal. Indemnite forfaitaire : 40 EUR.');
  const [notes, setNotes] = useState('');
  const [lignes, setLignes] = useState<LigneFacture[]>([newLigne()]);
  const [saving, setSaving] = useState(false);
  const [fromDevis, setFromDevis] = useState<string | null>(null);

  // Charger les contacts
  useEffect(() => {
    fetch('/api/contacts').then((r) => r.json()).then(setContacts);
  }, []);

  // Fermer le dropdown au clic exterieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowContactDropdown(false);
      }
    }
    if (showContactDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as unknown as EventListener);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside as unknown as EventListener);
      };
    }
  }, [showContactDropdown]);

  // Charger les chantiers
  useEffect(() => {
    fetch('/api/chantiers')
      .then((r) => r.json())
      .then((data: ChantierOption[]) => setChantiers(data));
  }, []);

  // Si on vient d'un devis, pre-remplir
  useEffect(() => {
    if (!devisId) return;
    fetch(`/api/devis/${devisId}`)
      .then((r) => r.json())
      .then((devis) => {
        setContactId(devis.contact?.id || devis.contactId);
        if (devis.chantierId) setChantierId(devis.chantierId);
        setFromDevis(devis.numero);
        setLignes(
          devis.lignes.map((l: { designation: string; description: string | null; quantite: string; unite: string; prixUnitaireHT: string; tauxTVA: string }) => ({
            id: crypto.randomUUID(),
            designation: l.designation,
            description: l.description || '',
            quantite: String(Number(l.quantite)),
            unite: l.unite,
            prixUnitaireHT: String(Number(l.prixUnitaireHT)),
            tauxTVA: String(Number(l.tauxTVA)),
          }))
        );
        if (devis.conditions) setConditions(devis.conditions);
      })
      .catch(() => {});
  }, [devisId]);

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

  const updateLigne = useCallback((id: string, field: keyof LigneFacture, value: string) => {
    setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }, []);

  function addLigne() {
    setLignes((prev) => [...prev, newLigne()]);
  }

  function removeLigne(id: string) {
    setLignes((prev) => prev.length > 1 ? prev.filter((l) => l.id !== id) : prev);
  }

  async function handleSave() {
    if (!contactId) { alert('Selectionnez un client.'); return; }
    const validLignes = lignes.filter((l) => l.designation.trim() && parseFloat(l.prixUnitaireHT) > 0);
    if (validLignes.length === 0) { alert('Ajoutez au moins une ligne.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/factures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          chantierId: chantierId || null,
          type: factureType,
          devisId: devisId || null,
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
        alert(err.error || 'Erreur');
        return;
      }

      const facture = await res.json();
      router.push(`/factures/${facture.id}`);
    } finally {
      setSaving(false);
    }
  }

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
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Nouvelle facture</h1>
            {fromDevis && <p className="text-sm text-blue-600">Depuis devis {fromDevis}</p>}
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl
                     font-semibold text-sm active:scale-95 transition-transform min-h-[44px]
                     disabled:opacity-50">
          <Save size={18} />
          <span className="hidden lg:inline">{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
        </button>
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
                  onClick={() => setFactureType(t.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px]
                    ${factureType === t.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Client */}
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Client</h2>
            <div className="relative" ref={dropdownRef}>
              {selectedContact ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedContact.nom}{selectedContact.prenom ? ` ${selectedContact.prenom}` : ''}
                    </p>
                    {selectedContact.entreprise && <p className="text-sm text-gray-500">{selectedContact.entreprise}</p>}
                  </div>
                  <button onClick={() => { setContactId(''); setContactSearch(''); }}
                    className="text-sm text-blue-600 font-medium min-h-[44px] px-3">
                    Changer
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => { setContactSearch(e.target.value); setShowContactDropdown(true); }}
                    onFocus={() => setShowContactDropdown(true)}
                    placeholder="Rechercher un client..."
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {showContactDropdown && filteredContacts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredContacts.map((c) => (
                        <button key={c.id}
                          onClick={() => { setContactId(c.id); setShowContactDropdown(false); setContactSearch(''); }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100
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
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <div key={ligne.id} className="border border-gray-100 rounded-xl p-3 lg:p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical size={16} className="text-gray-300" />
                      <span className="text-xs font-medium text-gray-400">Ligne {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{formatEuros(calcLigneHT(ligne))}</span>
                      {lignes.length > 1 && (
                        <button onClick={() => removeLigne(ligne.id)}
                          className="p-2 rounded-xl hover:bg-red-50" aria-label="Supprimer">
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                  <input type="text" value={ligne.designation}
                    onChange={(e) => updateLigne(ligne.id, 'designation', e.target.value)}
                    placeholder="Designation"
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500" />
                  <input type="text" value={ligne.description}
                    onChange={(e) => updateLigne(ligne.id, 'description', e.target.value)}
                    placeholder="Description (optionnel)"
                    className="w-full h-10 px-3 rounded-xl border border-gray-100 text-sm text-gray-500 focus:ring-2 focus:ring-blue-500" />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Quantite</label>
                      <input type="number" step="0.001" min="0" value={ligne.quantite}
                        onChange={(e) => updateLigne(ligne.id, 'quantite', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Unite</label>
                      <select value={ligne.unite} onChange={(e) => updateLigne(ligne.id, 'unite', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500">
                        {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Prix HT</label>
                      <input type="number" step="0.01" min="0" value={ligne.prixUnitaireHT}
                        onChange={(e) => updateLigne(ligne.id, 'prixUnitaireHT', e.target.value)}
                        placeholder="0.00"
                        className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">TVA</label>
                      <select value={ligne.tauxTVA} onChange={(e) => updateLigne(ligne.id, 'tauxTVA', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500">
                        {TAUX_TVA.map((t) => <option key={t} value={t}>{t}%</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addLigne}
              className="mt-3 flex items-center gap-2 w-full justify-center p-3 rounded-xl border-2 border-dashed
                         border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600
                         active:bg-blue-50 transition-colors min-h-[48px] font-medium text-sm">
              <Plus size={18} />
              Ajouter une ligne
            </button>
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

            <button onClick={handleSave} disabled={saving}
              className="lg:hidden mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 text-white
                         px-4 py-3 rounded-xl font-semibold min-h-[48px] disabled:opacity-50">
              <Save size={18} />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Echeance</h2>
            <input type="date" value={dateEcheance}
              onChange={(e) => setDateEcheance(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Conditions</h2>
            <textarea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Notes internes</h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Notes visibles uniquement par vous..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
