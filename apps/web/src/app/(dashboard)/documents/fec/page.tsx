'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Download, FileText, Info, AlertCircle, Loader2,
} from 'lucide-react';

type FECEntry = {
  ecritureNum: string;
  ecritureDate: string;
  compteNum: string;
  compteLib: string;
  pieceRef: string;
  ecritureLib: string;
  debit: string;
  credit: string;
};

function formatEuros(value: string | number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value));
}

export default function FECPage() {
  const currentYear = new Date().getFullYear();
  const [annee, setAnnee] = useState(currentYear);
  const [entries, setEntries] = useState<FECEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalEntries, setTotalEntries] = useState(0);

  // Annees disponibles (5 dernieres annees)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    loadPreview();
  }, [annee]);

  async function loadPreview() {
    setLoading(true);
    setError('');
    setEntries([]);

    try {
      const res = await fetch(`/api/export/fec?annee=${annee}`);

      if (res.status === 404) {
        setError('Aucune facture trouvee pour cette annee.');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erreur lors du chargement.');
        return;
      }

      const text = await res.text();
      // Parser le FEC pour l'apercu
      const lines = text.replace(/^\uFEFF/, '').split('\r\n').filter(Boolean);
      if (lines.length <= 1) {
        setError('Aucune ecriture trouvee.');
        return;
      }

      const parsed: FECEntry[] = [];
      // Skip header (index 0)
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split('\t');
        if (cols.length < 18) continue;
        parsed.push({
          ecritureNum: cols[2],
          ecritureDate: `${cols[3].slice(6, 8)}/${cols[3].slice(4, 6)}/${cols[3].slice(0, 4)}`,
          compteNum: cols[4],
          compteLib: cols[5],
          pieceRef: cols[8],
          ecritureLib: cols[10],
          debit: cols[11],
          credit: cols[12],
        });
      }

      setEntries(parsed);
      setTotalEntries(parsed.length);
    } catch {
      setError('Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    try {
      const res = await fetch(`/api/export/fec?annee=${annee}`);
      if (!res.ok) {
        alert('Erreur lors du telechargement.');
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `FEC_${annee}.txt`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors du telechargement.');
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/documents"
          className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Retour">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Fichier des Ecritures Comptables (FEC)
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Export obligatoire en cas de controle fiscal
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900">Qu&apos;est-ce que le FEC ?</p>
            <p className="text-sm text-blue-700 mt-1">
              Le Fichier des Ecritures Comptables est un fichier normalise requis par
              l&apos;article A47 A-1 du Livre des Procedures Fiscales. Il doit etre fourni
              a l&apos;administration fiscale en cas de controle. Le fichier contient toutes
              les ecritures comptables de l&apos;exercice au format texte tabule.
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="annee" className="text-sm font-medium text-gray-700">
            Exercice comptable :
          </label>
          <select
            id="annee"
            value={annee}
            onChange={(e) => setAnnee(parseInt(e.target.value))}
            className="h-11 px-4 rounded-xl border border-gray-200 text-base bg-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="sm:ml-auto flex items-center gap-2">
          {totalEntries > 0 && (
            <span className="text-sm text-gray-500">
              {totalEntries} ecritures
            </span>
          )}
          <button
            onClick={handleDownload}
            disabled={loading || entries.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl
                       font-semibold text-base active:scale-95 transition-transform min-h-[48px]
                       disabled:opacity-50 disabled:active:scale-100 hover:bg-blue-700"
          >
            <Download size={18} />
            Telecharger le FEC
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-500">Chargement des ecritures...</span>
        </div>
      )}

      {/* Preview table */}
      {!loading && entries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-gray-400" />
              <h2 className="font-semibold text-gray-900">Apercu des ecritures</h2>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-2">N°</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-2">Date</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-2">Compte</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-2">Libelle compte</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-2">Piece</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-2">Description</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 py-2">Debit</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 py-2">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.slice(0, 100).map((e, i) => {
                  const debit = parseFloat(e.debit.replace(',', '.'));
                  const credit = parseFloat(e.credit.replace(',', '.'));
                  return (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2 text-gray-500 font-mono text-xs">{e.ecritureNum}</td>
                      <td className="px-4 py-2 text-gray-600">{e.ecritureDate}</td>
                      <td className="px-4 py-2 font-mono text-gray-900">{e.compteNum}</td>
                      <td className="px-4 py-2 text-gray-600">{e.compteLib}</td>
                      <td className="px-4 py-2 text-gray-600">{e.pieceRef}</td>
                      <td className="px-4 py-2 text-gray-500 max-w-[200px] truncate">{e.ecritureLib}</td>
                      <td className="px-4 py-2 text-right font-mono">
                        {debit > 0 ? <span className="text-gray-900">{formatEuros(debit)}</span> : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {credit > 0 ? <span className="text-gray-900">{formatEuros(credit)}</span> : <span className="text-gray-300">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {entries.length > 100 && (
              <div className="p-4 text-center text-sm text-gray-400 border-t border-gray-100">
                Affichage limite aux 100 premieres ecritures sur {entries.length} au total.
                Telechargez le fichier pour voir l&apos;ensemble.
              </div>
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-50">
            {entries.slice(0, 50).map((e, i) => {
              const debit = parseFloat(e.debit.replace(',', '.'));
              const credit = parseFloat(e.credit.replace(',', '.'));
              return (
                <div key={i} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400 font-mono">{e.ecritureNum} - {e.ecritureDate}</span>
                    <span className="text-xs font-medium text-gray-500">{e.pieceRef}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{e.compteNum} - {e.compteLib}</p>
                    </div>
                    <div className="text-right ml-3">
                      {debit > 0 && <p className="text-sm font-medium text-gray-900">D {formatEuros(debit)}</p>}
                      {credit > 0 && <p className="text-sm font-medium text-gray-900">C {formatEuros(credit)}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
            {entries.length > 50 && (
              <div className="p-4 text-center text-sm text-gray-400">
                +{entries.length - 50} ecritures supplementaires
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-lg font-medium text-gray-500">Aucune ecriture pour {annee}</p>
          <p className="text-sm text-gray-400 mt-1">
            Les factures emises apparaitront ici automatiquement.
          </p>
        </div>
      )}
    </div>
  );
}
