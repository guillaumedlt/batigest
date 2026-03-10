'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Landmark, Printer, ChevronLeft, ChevronRight,
  AlertTriangle, ScrollText, Info,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type Entreprise = {
  nomEntreprise: string | null;
  siret: string | null;
  formeJuridique: string | null;
  franchiseTVA: boolean;
  regimeTVA: string;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
};

type Facture = {
  id: string;
  numero: string;
  dateEmission: string;
  totalHT: string;
  totalTTC: string;
  statut: string;
  type: string;
};

function formatEuros(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

// Taux de cotisations auto-entrepreneur BTP (2024/2025)
const TAUX_COTISATIONS = {
  prestations: 0.217, // 21.7% pour prestations de services artisanales
  vente: 0.123,       // 12.3% pour vente de marchandises
};

export default function UrssafPage() {
  const searchParams = useSearchParams();
  const initialSection = searchParams.get('section') === 'franchise' ? 'franchise' : 'urssaf';

  const [section, setSection] = useState<'urssaf' | 'franchise'>(initialSection);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodeMode, setPeriodeMode] = useState<'mensuel' | 'trimestriel'>('trimestriel');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const year = currentDate.getFullYear();
    Promise.all([
      fetch('/api/entreprise').then((r) => r.json()),
      fetch(`/api/factures?year=${year}`).then((r) => r.json()),
    ]).then(([ent, fac]) => {
      setEntreprise(ent);
      setFactures(Array.isArray(fac) ? fac : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [currentDate]);

  function navigate(dir: -1 | 1) {
    const d = new Date(currentDate);
    if (periodeMode === 'mensuel') {
      d.setMonth(d.getMonth() + dir);
    } else {
      d.setMonth(d.getMonth() + dir * 3);
    }
    setCurrentDate(d);
  }

  function getPeriodeLabel(): string {
    const y = currentDate.getFullYear();
    if (periodeMode === 'mensuel') {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else {
      const t = Math.floor(currentDate.getMonth() / 3) + 1;
      return `${t}e trimestre ${y}`;
    }
  }

  // Filtrer les factures de la periode
  function getFacturesPeriode(): Facture[] {
    const y = currentDate.getFullYear();
    let debut: Date;
    let fin: Date;

    if (periodeMode === 'mensuel') {
      debut = new Date(y, currentDate.getMonth(), 1);
      fin = new Date(y, currentDate.getMonth() + 1, 0, 23, 59, 59);
    } else {
      const t = Math.floor(currentDate.getMonth() / 3);
      debut = new Date(y, t * 3, 1);
      fin = new Date(y, (t + 1) * 3, 0, 23, 59, 59);
    }

    return factures.filter((f) => {
      if (f.statut === 'BROUILLON') return false;
      const d = new Date(f.dateEmission);
      return d >= debut && d <= fin;
    });
  }

  const facturesPeriode = getFacturesPeriode();
  const caEncaisse = facturesPeriode
    .filter((f) => f.type !== 'AVOIR')
    .reduce((sum, f) => sum + Number(f.totalTTC), 0);
  const avoirs = facturesPeriode
    .filter((f) => f.type === 'AVOIR')
    .reduce((sum, f) => sum + Number(f.totalTTC), 0);
  const caNet = caEncaisse - avoirs;
  const cotisationsPrestations = caNet * TAUX_COTISATIONS.prestations;

  // Echeances URSSAF
  function getEcheance(): string {
    if (periodeMode === 'mensuel') {
      const next = new Date(currentDate);
      next.setMonth(next.getMonth() + 1);
      return `Avant le dernier jour de ${next.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    } else {
      const t = Math.floor(currentDate.getMonth() / 3) + 1;
      const echeances: Record<number, string> = {
        1: '30 avril', 2: '31 juillet', 3: '31 octobre', 4: '31 janvier',
      };
      const y = t === 4 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
      return `Avant le ${echeances[t]} ${y}`;
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/documents" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {section === 'urssaf' ? 'Declaration CA URSSAF' : 'Attestation franchise TVA'}
            </h1>
            <p className="text-sm text-gray-500">Auto-entrepreneur / Micro-entreprise</p>
          </div>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors min-h-[44px]">
          <Printer size={16} /> <span className="hidden sm:inline">Imprimer</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 print:hidden">
        <button onClick={() => setSection('urssaf')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
            section === 'urssaf' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Landmark size={16} /> Declaration CA
        </button>
        <button onClick={() => setSection('franchise')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
            section === 'franchise' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <ScrollText size={16} /> Franchise TVA
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
      ) : section === 'urssaf' ? (
        <>
          {/* Navigation periode */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm print:hidden">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <div className="text-center">
              <p className="font-semibold text-gray-900 capitalize">{getPeriodeLabel()}</p>
              <div className="flex gap-2 mt-2 justify-center">
                {(['mensuel', 'trimestriel'] as const).map((m) => (
                  <button key={m} onClick={() => setPeriodeMode(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[32px] ${periodeMode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {m === 'mensuel' ? 'Mensuel' : 'Trimestriel'}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Echeance */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-2">
            <Info size={16} className="text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Echeance :</span> {getEcheance()} sur autoentrepreneur.urssaf.fr
            </p>
          </div>

          {/* Resume CA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">CA encaisse</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatEuros(caEncaisse)}</p>
              <p className="text-xs text-gray-400 mt-1">{facturesPeriode.filter((f) => f.type !== 'AVOIR').length} facture(s)</p>
            </div>
            {avoirs > 0 && (
              <div className="bg-red-50 rounded-2xl p-4 md:p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-500">Avoirs</p>
                <p className="text-2xl font-bold text-red-600 mt-1">-{formatEuros(avoirs)}</p>
              </div>
            )}
            <div className={`rounded-2xl p-4 md:p-5 shadow-sm ${caNet > 0 ? 'bg-emerald-50' : 'bg-gray-50'}`}>
              <p className="text-sm font-medium text-gray-500">CA net a declarer</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatEuros(caNet)}</p>
            </div>
          </div>

          {/* Calcul des cotisations */}
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Estimation des cotisations</h2>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-600">CA net (prestations de services)</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatEuros(caNet)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-600">Taux de cotisations (BTP artisanal)</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-900">{(TAUX_COTISATIONS.prestations * 100).toFixed(1)}%</td>
                  </tr>
                  <tr className="bg-indigo-50">
                    <td className="px-4 py-3 font-bold text-gray-900">Cotisations estimees</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700 text-base">{formatEuros(cotisationsPrestations)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3 italic">
              Estimation basee sur le taux en vigueur pour les prestations de services artisanales (BIC).
              Le montant exact peut varier selon votre situation (ACRE, versement liberatoire, etc.).
            </p>
          </div>

          {/* Comment declarer */}
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm print:hidden">
            <p className="text-sm text-gray-700 font-medium mb-2">Comment declarer ?</p>
            <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
              <li>Connectez-vous sur <span className="font-medium">autoentrepreneur.urssaf.fr</span></li>
              <li>Cliquez sur <span className="font-medium">Declarer et payer</span></li>
              <li>Saisissez votre CA de la periode : <span className="font-semibold text-gray-900">{formatEuros(caNet)}</span></li>
              <li>Verifiez le montant des cotisations et validez</li>
              <li>Le prelevement sera effectue a la date d&apos;echeance</li>
            </ol>
          </div>

          {/* Seuils */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 print:hidden">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Seuils de CA auto-entrepreneur (BTP)</p>
                <ul className="text-sm text-amber-700 mt-1 space-y-0.5">
                  <li>Prestations de services : <span className="font-semibold">77 700 EUR / an</span></li>
                  <li>Vente de marchandises : <span className="font-semibold">188 700 EUR / an</span></li>
                </ul>
                <p className="text-xs text-amber-600 mt-1">
                  En cas de depassement, vous devez passer au regime reel dans les 2 ans.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ATTESTATION FRANCHISE TVA */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm print:shadow-none print:p-0">
            <div className="max-w-[700px] mx-auto space-y-6 text-sm text-gray-800 leading-relaxed">
              <div className="text-center border-b-2 border-gray-800 pb-4">
                <h2 className="text-lg font-bold text-gray-900">ATTESTATION DE FRANCHISE EN BASE DE TVA</h2>
                <p className="text-sm text-gray-600 mt-1">Article 293 B du Code general des impots</p>
              </div>

              <div>
                <p>{entreprise?.nomEntreprise || '[Nom de l\'entreprise]'},
                {entreprise?.formeJuridique || '[Forme juridique]'},
                SIRET {entreprise?.siret || '_______________'},
                ayant son siege au {entreprise?.adresse || '_______________'},
                {entreprise?.codePostal} {entreprise?.ville}.</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 text-center">
                <p className="text-base font-bold text-gray-900">
                  &laquo; TVA non applicable, article 293 B du Code general des impots &raquo;
                </p>
              </div>

              <div>
                <p>
                  Conformement a l&apos;article 293 B du Code general des impots, l&apos;entreprise
                  {' '}{entreprise?.nomEntreprise || '[Nom]'} beneficie de la franchise en base de TVA.
                  A ce titre :
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>L&apos;entreprise ne facture pas la TVA a ses clients</li>
                  <li>La mention ci-dessus doit figurer sur tous les devis et factures</li>
                  <li>L&apos;entreprise ne peut pas recuperer la TVA sur ses achats</li>
                  <li>Les prix indiques sur les devis et factures sont les prix nets</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Seuils applicables</h3>
                <div className="space-y-2">
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="font-medium">Prestations de services</p>
                    <p className="text-gray-600">Seuil de franchise : <span className="font-semibold">37 500 EUR</span> / Seuil majore : <span className="font-semibold">41 250 EUR</span></p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="font-medium">Vente de marchandises</p>
                    <p className="text-gray-600">Seuil de franchise : <span className="font-semibold">85 000 EUR</span> / Seuil majore : <span className="font-semibold">93 500 EUR</span></p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 text-xs text-gray-500 text-center">
                <p>Fait a {entreprise?.ville || '________________'}, le {new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>

          {/* Mention a copier */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 print:hidden">
            <p className="text-sm text-blue-800 font-semibold mb-2">Mention a faire figurer sur vos devis et factures :</p>
            <div className="bg-white rounded-xl p-4 border border-blue-200">
              <p className="text-sm font-medium text-gray-900 text-center">
                TVA non applicable, article 293 B du Code general des impots
              </p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Cette mention est automatiquement ajoutee sur les devis et factures generes par BatiGest.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
