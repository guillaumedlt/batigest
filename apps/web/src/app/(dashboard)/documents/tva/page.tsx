'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calculator, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight,
  AlertTriangle, Info, Download, FileText, Printer, ClipboardList, FileSpreadsheet,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

type TvaData = {
  regime: string;
  franchiseTVA: boolean;
  mention?: string;
  periode: { debut: string; fin: string; label: string };
  collectee: {
    total: number;
    nbFactures?: number;
    nbAvoirs?: number;
    parTaux: Record<string, { base: number; tva: number }>;
  };
  deductible: {
    total: number;
    nbAchats?: number;
    parTaux: Record<string, { base: number; tva: number }>;
  };
  solde: number;
  aPayerOuCredit?: string;
};

const REGIME_LABELS: Record<string, string> = {
  FRANCHISE: 'Franchise en base (pas de TVA)',
  REEL_SIMPLIFIE: 'Reel simplifie',
  REEL_NORMAL: 'Reel normal',
};

const TAUX_LABELS: Record<string, string> = {
  '20': 'Taux normal (20%)', '20.00': 'Taux normal (20%)',
  '10': 'Taux intermediaire (10%)', '10.00': 'Taux intermediaire (10%)',
  '5.5': 'Taux reduit (5,5%)', '5.50': 'Taux reduit (5,5%)',
  '0': 'Exonere (0%)', '0.00': 'Exonere (0%)',
};

const TAUX_DESCRIPTIONS: Record<string, string> = {
  '20': 'Construction neuve, extensions, amenagements exterieurs',
  '20.00': 'Construction neuve, extensions, amenagements exterieurs',
  '10': 'Renovation logements > 2 ans (plomberie, electricite, peinture...)',
  '10.00': 'Renovation logements > 2 ans (plomberie, electricite, peinture...)',
  '5.5': 'Renovation energetique (isolation, PAC, VMC...)',
  '5.50': 'Renovation energetique (isolation, PAC, VMC...)',
  '0': 'Operations exonerees', '0.00': 'Operations exonerees',
};

// Correspondance lignes CA3 (formulaire 3310)
const CA3_LIGNES: Record<string, { ligne: string; label: string }> = {
  '20': { ligne: '08', label: 'Operations imposables a 20%' },
  '20.00': { ligne: '08', label: 'Operations imposables a 20%' },
  '10': { ligne: '09', label: 'Operations imposables a 10%' },
  '10.00': { ligne: '09', label: 'Operations imposables a 10%' },
  '5.5': { ligne: '9B', label: 'Operations imposables a 5,5%' },
  '5.50': { ligne: '9B', label: 'Operations imposables a 5,5%' },
};

function formatEuros(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatEurosInt(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(value));
}

function getTauxLabel(taux: string) {
  return TAUX_LABELS[taux] || `TVA ${taux}%`;
}

type ViewMode = 'mensuel' | 'trimestriel';

export default function TvaPage() {
  const [data, setData] = useState<TvaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('trimestriel');
  const [currentDate, setCurrentDate] = useState(new Date());

  const getPeriodeParam = useCallback((): string => {
    const y = currentDate.getFullYear();
    if (viewMode === 'mensuel') {
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      return `mois=${y}-${m}`;
    } else {
      const t = Math.floor(currentDate.getMonth() / 3) + 1;
      return `periode=${y}-T${t}`;
    }
  }, [currentDate, viewMode]);

  function getPeriodeLabel(): string {
    const y = currentDate.getFullYear();
    if (viewMode === 'mensuel') {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else {
      const t = Math.floor(currentDate.getMonth() / 3) + 1;
      return `${t}e trimestre ${y}`;
    }
  }

  function getEcheanceLabel(): string {
    if (viewMode === 'mensuel') {
      const next = new Date(currentDate);
      next.setMonth(next.getMonth() + 1);
      return `entre le 15 et le 24 ${next.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    } else {
      const t = Math.floor(currentDate.getMonth() / 3) + 1;
      const months = ['', 'avril', 'juillet', 'octobre', 'janvier'];
      const y = t === 4 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
      return `avant le 24 ${months[t]} ${y}`;
    }
  }

  function navigate(dir: -1 | 1) {
    const d = new Date(currentDate);
    if (viewMode === 'mensuel') {
      d.setMonth(d.getMonth() + dir);
    } else {
      d.setMonth(d.getMonth() + dir * 3);
    }
    setCurrentDate(d);
  }

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tva?${getPeriodeParam()}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [getPeriodeParam]);

  function downloadCSV() {
    window.open(`/api/tva/export?${getPeriodeParam()}`, '_blank');
  }

  function printDeclaration() {
    window.print();
  }

  function getCA3Lines() {
    if (!data || data.franchiseTVA) return [];
    const lines: { ligne: string; label: string; base: number; tva: number }[] = [];
    for (const [taux, vals] of Object.entries(data.collectee.parTaux)) {
      const ca3 = CA3_LIGNES[taux];
      if (ca3 && vals.base !== 0) {
        lines.push({ ligne: ca3.ligne, label: ca3.label, base: vals.base, tva: vals.tva });
      }
    }
    return lines.sort((a, b) => a.ligne.localeCompare(b.ligne));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/documents" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Declaration TVA</h1>
        </div>
        {data && !data.franchiseTVA && (
          <div className="flex gap-2">
            <button onClick={downloadCSV}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors min-h-[44px]">
              <FileSpreadsheet size={16} /> <span className="hidden sm:inline">CSV</span>
            </button>
            <button onClick={printDeclaration}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors min-h-[44px]">
              <Printer size={16} /> <span className="hidden sm:inline">Imprimer</span>
            </button>
          </div>
        )}
      </div>

      {/* Regime */}
      {data && (
        <div className={`rounded-2xl p-4 shadow-sm ${data.franchiseTVA ? 'bg-amber-50 border border-amber-200' : 'bg-white'}`}>
          <div className="flex items-start gap-3">
            {data.franchiseTVA
              ? <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
              : <Info size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />}
            <div>
              <p className="font-semibold text-gray-900">Regime : {REGIME_LABELS[data.regime] || data.regime}</p>
              {data.franchiseTVA && <p className="text-sm text-amber-700 mt-1">{data.mention}</p>}
              {!data.franchiseTVA && data.regime === 'REEL_SIMPLIFIE' && (
                <p className="text-sm text-gray-500 mt-1">Declaration annuelle CA12 + 2 acomptes semestriels (juillet et decembre)</p>
              )}
              {!data.franchiseTVA && data.regime === 'REEL_NORMAL' && (
                <p className="text-sm text-gray-500 mt-1">Declaration mensuelle CA3 (entre le 15 et le 24 du mois suivant)</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Franchise info */}
      {data?.franchiseTVA && (
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Seuils de franchise en base</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700">Prestations de services</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900">37 500 EUR</span>
                <span className="text-sm text-gray-500">seuil de franchise</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Seuil majore : 41 250 EUR</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700">Vente de marchandises</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900">85 000 EUR</span>
                <span className="text-sm text-gray-500">seuil de franchise</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Seuil majore : 93 500 EUR</p>
            </div>
          </div>

          <h2 className="font-semibold text-gray-900 mt-8 mb-4">Taux de TVA dans le batiment</h2>
          <div className="space-y-3">
            {[
              { taux: '20%', color: 'bg-red-100 text-red-700', label: 'Taux normal', desc: 'Construction neuve, extensions >10% surface, amenagements exterieurs' },
              { taux: '10%', color: 'bg-orange-100 text-orange-700', label: 'Taux intermediaire', desc: 'Renovation logements > 2 ans (plomberie, electricite, peinture, carrelage...)' },
              { taux: '5,5%', color: 'bg-green-100 text-green-700', label: 'Taux reduit', desc: 'Renovation energetique : isolation, PAC, VMC double flux, chaudieres THPE, fenetres' },
            ].map((t) => (
              <div key={t.taux} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 ${t.color} text-xs font-bold rounded`}>{t.taux}</span>
                  <span className="font-medium text-gray-900">{t.label}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard TVA (assujetti) */}
      {data && !data.franchiseTVA && (
        <>
          {/* Navigation periode */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <div className="text-center">
              <p className="font-semibold text-gray-900 capitalize">{getPeriodeLabel()}</p>
              <div className="flex gap-2 mt-2 justify-center">
                {(['mensuel', 'trimestriel'] as const).map((m) => (
                  <button key={m} onClick={() => setViewMode(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[32px] ${viewMode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {m === 'mensuel' ? 'Mensuel' : 'Trimestriel'}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-10 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Resume 3 cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} className="text-blue-600" />
                    <p className="text-sm font-medium text-gray-500">TVA collectee</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatEuros(data.collectee.total)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {data.collectee.nbFactures} facture{(data.collectee.nbFactures || 0) > 1 ? 's' : ''}
                    {(data.collectee.nbAvoirs || 0) > 0 && ` · ${data.collectee.nbAvoirs} avoir${(data.collectee.nbAvoirs || 0) > 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={18} className="text-green-600" />
                    <p className="text-sm font-medium text-gray-500">TVA deductible</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatEuros(data.deductible.total)}</p>
                  <p className="text-xs text-gray-400 mt-1">{data.deductible.nbAchats} achat{(data.deductible.nbAchats || 0) > 1 ? 's' : ''}</p>
                </div>
                <div className={`rounded-2xl p-4 md:p-5 shadow-sm ${data.solde > 0 ? 'bg-red-50' : data.solde < 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {data.solde > 0 ? <Calculator size={18} className="text-red-600" />
                      : data.solde < 0 ? <Calculator size={18} className="text-green-600" />
                      : <Minus size={18} className="text-gray-500" />}
                    <p className="text-sm font-medium text-gray-500">
                      {data.solde > 0 ? 'TVA a payer' : data.solde < 0 ? 'Credit de TVA' : 'Solde'}
                    </p>
                  </div>
                  <p className={`text-2xl font-bold ${data.solde > 0 ? 'text-red-700' : data.solde < 0 ? 'text-green-700' : 'text-gray-900'}`}>
                    {formatEuros(Math.abs(data.solde))}
                  </p>
                  {data.solde < 0 && <p className="text-xs text-green-600 mt-1">Remboursable via formulaire 3519</p>}
                </div>
              </div>

              {/* RECAPITULATIF CA3 PRE-REMPLI */}
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm print:shadow-none print:border print:border-gray-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <ClipboardList size={18} className="text-blue-600" />
                    Recapitulatif {data.regime === 'REEL_NORMAL' ? 'CA3 (3310)' : 'CA12'}
                  </h2>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">{getPeriodeLabel()}</span>
                </div>

                {/* Echeance */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Echeance :</span> {getEcheanceLabel()}
                  </p>
                </div>

                {/* Tableau style formulaire fiscal */}
                <div className="border border-gray-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Ligne</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Designation</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">Base HT</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">TVA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Section A */}
                      <tr className="bg-blue-50/50 border-b border-gray-100">
                        <td colSpan={4} className="px-4 py-2 font-semibold text-blue-800 text-xs uppercase tracking-wider">
                          A — TVA brute (collectee sur ventes)
                        </td>
                      </tr>
                      {getCA3Lines().map((l) => (
                        <tr key={l.ligne} className="border-b border-gray-100">
                          <td className="px-4 py-2.5 font-mono text-gray-500">{l.ligne}</td>
                          <td className="px-4 py-2.5 text-gray-800">{l.label}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-900">{formatEurosInt(l.base)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-900">{formatEurosInt(l.tva)}</td>
                        </tr>
                      ))}
                      {getCA3Lines().length === 0 && (
                        <tr className="border-b border-gray-100">
                          <td colSpan={4} className="px-4 py-3 text-gray-400 text-center italic">Aucune operation</td>
                        </tr>
                      )}
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <td className="px-4 py-2.5 font-mono text-gray-500">16</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900">Total TVA brute</td>
                        <td className="px-4 py-2.5"></td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-700">{formatEurosInt(data.collectee.total)}</td>
                      </tr>

                      {/* Section B */}
                      <tr className="bg-green-50/50 border-b border-gray-100">
                        <td colSpan={4} className="px-4 py-2 font-semibold text-green-800 text-xs uppercase tracking-wider">
                          B — TVA deductible (sur achats)
                        </td>
                      </tr>
                      {Object.entries(data.deductible.parTaux).filter(([, v]) => v.tva !== 0).sort(([a], [b]) => Number(b) - Number(a)).map(([taux, val]) => (
                        <tr key={taux} className="border-b border-gray-100">
                          <td className="px-4 py-2.5 font-mono text-gray-500">19</td>
                          <td className="px-4 py-2.5 text-gray-800">Biens et services a {taux}%</td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-900">{formatEurosInt(val.base)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-900">{formatEurosInt(val.tva)}</td>
                        </tr>
                      ))}
                      {Object.keys(data.deductible.parTaux).length === 0 && (
                        <tr className="border-b border-gray-100">
                          <td colSpan={4} className="px-4 py-3 text-gray-400 text-center italic">Aucun achat</td>
                        </tr>
                      )}
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <td className="px-4 py-2.5 font-mono text-gray-500">23</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900">Total TVA deductible</td>
                        <td className="px-4 py-2.5"></td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-green-700">{formatEurosInt(data.deductible.total)}</td>
                      </tr>

                      {/* Solde */}
                      <tr className={`${data.solde > 0 ? 'bg-red-50' : data.solde < 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <td className="px-4 py-3 font-mono text-gray-500">{data.solde >= 0 ? '28' : '25'}</td>
                        <td className="px-4 py-3 font-bold text-gray-900 text-base">
                          {data.solde > 0 ? 'TVA nette a payer (ligne 16 - ligne 23)' : data.solde < 0 ? 'Credit de TVA (ligne 23 - ligne 16)' : 'Solde nul'}
                        </td>
                        <td className="px-4 py-3"></td>
                        <td className={`px-4 py-3 text-right font-mono font-bold text-lg ${data.solde > 0 ? 'text-red-700' : data.solde < 0 ? 'text-green-700' : 'text-gray-900'}`}>
                          {formatEurosInt(Math.abs(data.solde))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-gray-400 mt-3 italic">
                  Les numeros de ligne correspondent au formulaire CA3 (3310). Reportez ces montants arrondis a l&apos;euro sur impots.gouv.fr
                </p>
              </div>

              {/* ACTIONS DECLARATION */}
              <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm print:hidden">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Download size={18} className="text-gray-600" />
                  Documents pour la declaration
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button onClick={downloadCSV}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left min-h-[44px]">
                    <FileSpreadsheet size={24} className="text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Export CSV</p>
                      <p className="text-xs text-gray-500">Detail factures + achats pour votre comptable</p>
                    </div>
                  </button>
                  <button onClick={printDeclaration}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left min-h-[44px]">
                    <Printer size={24} className="text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Imprimer le recapitulatif</p>
                      <p className="text-xs text-gray-500">Version imprimable pour vos archives</p>
                    </div>
                  </button>
                </div>

                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-700 font-medium mb-2">Comment declarer ?</p>
                  <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
                    <li>Connectez-vous sur <span className="font-medium">impots.gouv.fr</span> &gt; Espace professionnel</li>
                    <li>Allez dans <span className="font-medium">Declarer &gt; TVA</span></li>
                    <li>Selectionnez la periode ({getPeriodeLabel()})</li>
                    <li>Reportez les montants du tableau ci-dessus (arrondis a l&apos;euro)</li>
                    <li>Validez et payez le solde si TVA nette a payer</li>
                  </ol>
                </div>
              </div>

              {/* Detail par taux — collectee */}
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm print:hidden">
                <h2 className="font-semibold text-gray-900 mb-4">Detail — TVA collectee par taux</h2>
                {Object.keys(data.collectee.parTaux).length === 0 ? (
                  <p className="text-sm text-gray-400">Aucune facture emise sur cette periode</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.collectee.parTaux).sort(([a], [b]) => Number(b) - Number(a)).map(([taux, val]) => (
                      <div key={taux} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900">{getTauxLabel(taux)}</p>
                          <p className="text-xs text-gray-400">{TAUX_DESCRIPTIONS[taux] || ''}</p>
                          <p className="text-sm text-gray-500">Base HT : {formatEuros(val.base)}</p>
                        </div>
                        <span className="font-semibold text-gray-900">{formatEuros(val.tva)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-semibold">Total collectee</span>
                      <span className="font-bold text-blue-600">{formatEuros(data.collectee.total)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Detail par taux — deductible */}
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm print:hidden">
                <h2 className="font-semibold text-gray-900 mb-4">Detail — TVA deductible par taux</h2>
                {Object.keys(data.deductible.parTaux).length === 0 ? (
                  <p className="text-sm text-gray-400">Aucun achat enregistre sur cette periode</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.deductible.parTaux).sort(([a], [b]) => Number(b) - Number(a)).map(([taux, val]) => (
                      <div key={taux} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900">{getTauxLabel(taux)}</p>
                          <p className="text-sm text-gray-500">Base HT : {formatEuros(val.base)}</p>
                        </div>
                        <span className="font-semibold text-gray-900">{formatEuros(val.tva)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-semibold">Total deductible</span>
                      <span className="font-bold text-green-600">{formatEuros(data.deductible.total)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Guide + autoliquidation */}
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm print:hidden">
                <h2 className="font-semibold text-gray-900 mb-4">Guide des taux TVA batiment</h2>
                <div className="space-y-3">
                  {[
                    { taux: '20%', color: 'bg-red-100 text-red-700', label: 'Taux normal', desc: 'Construction neuve, extensions >10%, amenagements exterieurs' },
                    { taux: '10%', color: 'bg-orange-100 text-orange-700', label: 'Taux intermediaire', desc: 'Renovation logements >2 ans (plomberie, electricite, peinture...)' },
                    { taux: '5,5%', color: 'bg-green-100 text-green-700', label: 'Taux reduit', desc: 'Renovation energetique : isolation, PAC, VMC, fenetres, chaudieres THPE' },
                  ].map((t) => (
                    <div key={t.taux} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 ${t.color} text-xs font-bold rounded`}>{t.taux}</span>
                        <span className="font-medium text-gray-900">{t.label}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{t.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800">Autoliquidation — Sous-traitance BTP</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Si vous etes sous-traitant : facturez sans TVA avec la mention
                        &quot;Autoliquidation — article 283 du CGI&quot;. C&apos;est le donneur d&apos;ordre
                        qui declare et paie la TVA.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
