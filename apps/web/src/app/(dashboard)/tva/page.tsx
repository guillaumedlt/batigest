'use client';

import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, AlertTriangle, Info } from 'lucide-react';

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
  '20': 'Taux normal (20%)',
  '20.00': 'Taux normal (20%)',
  '10': 'Taux intermediaire (10%)',
  '10.00': 'Taux intermediaire (10%)',
  '5.5': 'Taux reduit (5,5%)',
  '5.50': 'Taux reduit (5,5%)',
  '0': 'Exonere (0%)',
  '0.00': 'Exonere (0%)',
};

const TAUX_DESCRIPTIONS: Record<string, string> = {
  '20': 'Construction neuve, extensions, amenagements exterieurs',
  '20.00': 'Construction neuve, extensions, amenagements exterieurs',
  '10': 'Renovation logements > 2 ans (plomberie, electricite, peinture...)',
  '10.00': 'Renovation logements > 2 ans (plomberie, electricite, peinture...)',
  '5.5': 'Renovation energetique (isolation, PAC, VMC...)',
  '5.50': 'Renovation energetique (isolation, PAC, VMC...)',
  '0': 'Operations exonerees',
  '0.00': 'Operations exonerees',
};

function formatEuros(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
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

  function getPeriodeParam(): string {
    const y = currentDate.getFullYear();
    if (viewMode === 'mensuel') {
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      return `mois=${y}-${m}`;
    } else {
      const t = Math.floor(currentDate.getMonth() / 3) + 1;
      return `periode=${y}-T${t}`;
    }
  }

  function getPeriodeLabel(): string {
    const y = currentDate.getFullYear();
    if (viewMode === 'mensuel') {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else {
      const t = Math.floor(currentDate.getMonth() / 3) + 1;
      return `${t}e trimestre ${y}`;
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
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [currentDate, viewMode]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">TVA</h1>
      </div>

      {/* Regime */}
      {data && (
        <div className={`rounded-2xl p-4 shadow-sm ${
          data.franchiseTVA ? 'bg-amber-50 border border-amber-200' : 'bg-white'
        }`}>
          <div className="flex items-start gap-3">
            {data.franchiseTVA ? (
              <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
            ) : (
              <Info size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="font-semibold text-gray-900">
                Regime : {REGIME_LABELS[data.regime] || data.regime}
              </p>
              {data.franchiseTVA && (
                <p className="text-sm text-amber-700 mt-1">
                  {data.mention}
                </p>
              )}
              {!data.franchiseTVA && data.regime === 'REEL_SIMPLIFIE' && (
                <p className="text-sm text-gray-500 mt-1">
                  Declaration annuelle CA12 + 2 acomptes semestriels (juillet et decembre)
                </p>
              )}
              {!data.franchiseTVA && data.regime === 'REEL_NORMAL' && (
                <p className="text-sm text-gray-500 mt-1">
                  Declaration mensuelle CA3 (entre le 15 et le 24 du mois suivant)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Si franchise, info supplementaire */}
      {data?.franchiseTVA && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
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
            <p className="text-xs text-gray-500">
              Si votre CA depasse le seuil majore, vous devez facturer la TVA immediatement.
              Entre le seuil de franchise et le seuil majore, vous restez exonere pour l&apos;annee
              en cours mais devrez facturer la TVA des le 1er janvier suivant.
            </p>
          </div>

          {/* Guide des taux — utile meme en franchise pour information */}
          <h2 className="font-semibold text-gray-900 mt-8 mb-4">Taux de TVA dans le batiment</h2>
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">20%</span>
                <span className="font-medium text-gray-900">Taux normal</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Construction neuve, extensions &gt;10% surface, amenagements exterieurs (terrasse, piscine, cloture)</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded">10%</span>
                <span className="font-medium text-gray-900">Taux intermediaire</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Travaux de renovation, amelioration, entretien sur logements de plus de 2 ans (plomberie, electricite, peinture, carrelage...)</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">5,5%</span>
                <span className="font-medium text-gray-900">Taux reduit</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Renovation energetique : isolation, pompes a chaleur, VMC double flux, chaudieres THPE, fenetres (simple → double vitrage)</p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard TVA (uniquement si assujetti) */}
      {data && !data.franchiseTVA && (
        <>
          {/* Navigation periode */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <div className="text-center">
              <p className="font-semibold text-gray-900 capitalize">{getPeriodeLabel()}</p>
              <div className="flex gap-2 mt-2 justify-center">
                <button
                  onClick={() => setViewMode('mensuel')}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    viewMode === 'mensuel' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Mensuel
                </button>
                <button
                  onClick={() => setViewMode('trimestriel')}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    viewMode === 'trimestriel' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Trimestriel
                </button>
              </div>
            </div>
            <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-gray-100">
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
              {/* Resume — 3 cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-5 shadow-sm">
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
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={18} className="text-green-600" />
                    <p className="text-sm font-medium text-gray-500">TVA deductible</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatEuros(data.deductible.total)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {data.deductible.nbAchats} achat{(data.deductible.nbAchats || 0) > 1 ? 's' : ''}
                  </p>
                </div>
                <div className={`rounded-2xl p-5 shadow-sm ${
                  data.solde > 0 ? 'bg-red-50' : data.solde < 0 ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {data.solde > 0 ? (
                      <Calculator size={18} className="text-red-600" />
                    ) : data.solde < 0 ? (
                      <Calculator size={18} className="text-green-600" />
                    ) : (
                      <Minus size={18} className="text-gray-500" />
                    )}
                    <p className="text-sm font-medium text-gray-500">
                      {data.solde > 0 ? 'TVA a payer' : data.solde < 0 ? 'Credit de TVA' : 'Solde'}
                    </p>
                  </div>
                  <p className={`text-2xl font-bold ${
                    data.solde > 0 ? 'text-red-700' : data.solde < 0 ? 'text-green-700' : 'text-gray-900'
                  }`}>
                    {formatEuros(Math.abs(data.solde))}
                  </p>
                  {data.solde < 0 && (
                    <p className="text-xs text-green-600 mt-1">Remboursable via formulaire 3519</p>
                  )}
                </div>
              </div>

              {/* Detail par taux — TVA collectee */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4">TVA collectee par taux</h2>
                {Object.keys(data.collectee.parTaux).length === 0 ? (
                  <p className="text-sm text-gray-400">Aucune facture emise sur cette periode</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.collectee.parTaux)
                      .sort(([a], [b]) => Number(b) - Number(a))
                      .map(([taux, val]) => (
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

              {/* Detail par taux — TVA deductible */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4">TVA deductible par taux</h2>
                {Object.keys(data.deductible.parTaux).length === 0 ? (
                  <p className="text-sm text-gray-400">Aucun achat enregistre sur cette periode</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.deductible.parTaux)
                      .sort(([a], [b]) => Number(b) - Number(a))
                      .map(([taux, val]) => (
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

              {/* Guide des taux */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4">Guide des taux TVA batiment</h2>
                <div className="space-y-3">
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">20%</span>
                      <span className="font-medium text-gray-900">Taux normal</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Construction neuve, extensions &gt;10%, amenagements exterieurs</p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded">10%</span>
                      <span className="font-medium text-gray-900">Taux intermediaire</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Renovation logements &gt;2 ans (plomberie, electricite, peinture, carrelage...)</p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">5,5%</span>
                      <span className="font-medium text-gray-900">Taux reduit</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Renovation energetique : isolation, PAC, VMC, fenetres, chaudieres THPE</p>
                  </div>
                </div>

                {/* Autoliquidation info */}
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
