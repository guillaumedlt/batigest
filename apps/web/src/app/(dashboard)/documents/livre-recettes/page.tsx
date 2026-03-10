'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, BookOpen, Printer, Download, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type Entreprise = {
  nomEntreprise: string | null;
  siret: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
};

type Facture = {
  id: string;
  numero: string;
  dateEmission: string;
  totalHT: string;
  totalTVA: string;
  totalTTC: string;
  statut: string;
  type: string;
  modePaiement: string | null;
  contact: { nom: string; prenom: string | null; entreprise: string | null };
};

type Achat = {
  id: string;
  designation: string;
  date: string;
  montantHT: string;
  montantTTC: string;
  tauxTVA: string;
  categorie: string;
  fournisseur: { nom: string; prenom: string | null; entreprise: string | null } | null;
};

function formatEuros(value: string | number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function LivreRecettesPage() {
  return (
    <Suspense fallback={<div className="animate-pulse p-6"><div className="h-8 bg-gray-200 rounded w-1/3" /></div>}>
      <LivreRecettesInner />
    </Suspense>
  );
}

function LivreRecettesInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'achats' ? 'achats' : 'recettes';

  const [tab, setTab] = useState<'recettes' | 'achats'>(initialTab);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [achats, setAchats] = useState<Achat[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    Promise.all([
      fetch('/api/entreprise').then((r) => r.json()),
      fetch(`/api/factures?year=${year}`).then((r) => r.json()),
      fetch(`/api/achats?year=${year}`).then((r) => r.json()),
    ]).then(([ent, fac, ach]) => {
      setEntreprise(ent);
      setFactures(Array.isArray(fac) ? fac : []);
      setAchats(Array.isArray(ach) ? ach : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year]);

  const totalRecettes = factures
    .filter((f) => f.statut !== 'BROUILLON' && f.type !== 'AVOIR')
    .reduce((sum, f) => sum + Number(f.totalTTC), 0);

  const totalAchats = achats.reduce((sum, a) => sum + Number(a.montantTTC), 0);

  const facturesTriees = [...factures]
    .filter((f) => f.statut !== 'BROUILLON')
    .sort((a, b) => new Date(a.dateEmission).getTime() - new Date(b.dateEmission).getTime());

  const achatsTriees = [...achats]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
              {tab === 'recettes' ? 'Livre des recettes' : 'Registre des achats'}
            </h1>
            <p className="text-sm text-gray-500">Obligatoire pour les auto-entrepreneurs et micro-entreprises</p>
          </div>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors min-h-[44px]">
          <Printer size={16} /> <span className="hidden sm:inline">Imprimer</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('recettes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
            tab === 'recettes' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <BookOpen size={16} /> Recettes
        </button>
        <button onClick={() => setTab('achats')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
            tab === 'achats' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Download size={16} /> Achats
        </button>
      </div>

      {/* Year navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
        <button onClick={() => setYear(year - 1)} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-gray-900 text-lg">{year}</p>
          <p className="text-sm text-gray-500">
            {tab === 'recettes'
              ? `${facturesTriees.length} facture${facturesTriees.length > 1 ? 's' : ''} · Total : ${formatEuros(totalRecettes)}`
              : `${achatsTriees.length} achat${achatsTriees.length > 1 ? 's' : ''} · Total : ${formatEuros(totalAchats)}`}
          </p>
        </div>
        <button onClick={() => setYear(year + 1)} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Entreprise header for print */}
      {entreprise && (
        <div className="hidden print:block border-b border-gray-300 pb-4 mb-4">
          <h2 className="text-xl font-bold">{entreprise.nomEntreprise}</h2>
          <p className="text-sm text-gray-600">SIRET : {entreprise.siret}</p>
          <p className="text-sm text-gray-600">{entreprise.adresse}, {entreprise.codePostal} {entreprise.ville}</p>
          <p className="text-sm font-semibold mt-2">
            {tab === 'recettes' ? 'LIVRE DES RECETTES' : 'REGISTRE DES ACHATS'} — Annee {year}
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : tab === 'recettes' ? (
        <>
          {/* Tableau recettes */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">N° Facture</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Client</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Mode</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Montant TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {facturesTriees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                        Aucune facture pour {year}
                      </td>
                    </tr>
                  ) : (
                    <>
                      {facturesTriees.map((f, idx) => {
                        const client = f.contact.entreprise || `${f.contact.nom} ${f.contact.prenom || ''}`.trim();
                        const isAvoir = f.type === 'AVOIR';
                        return (
                          <tr key={f.id} className={`border-b border-gray-50 ${isAvoir ? 'bg-red-50/50' : ''}`}>
                            <td className="px-4 py-3 text-gray-600">{formatDate(f.dateEmission)}</td>
                            <td className="px-4 py-3 font-mono text-gray-900">
                              {f.numero} {isAvoir && <span className="text-xs text-red-600 font-medium ml-1">AVOIR</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-800">{client}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{f.modePaiement || '—'}</td>
                            <td className={`px-4 py-3 text-right font-mono font-semibold ${isAvoir ? 'text-red-600' : 'text-gray-900'}`}>
                              {isAvoir ? '-' : ''}{formatEuros(f.totalTTC)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td colSpan={4} className="px-4 py-3 font-bold text-gray-900">TOTAL {year}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 text-base">
                          {formatEuros(totalRecettes)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 print:hidden">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Obligation legale :</span> Le livre des recettes doit etre tenu
              chronologiquement et comporter pour chaque recette : la date, la reference de la facture,
              le client, la nature de la prestation, le montant et le mode de reglement.
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Tableau achats */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Designation</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Fournisseur</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Montant HT</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Montant TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {achatsTriees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                        Aucun achat pour {year}
                      </td>
                    </tr>
                  ) : (
                    <>
                      {achatsTriees.map((a) => {
                        const fourn = a.fournisseur
                          ? (a.fournisseur.entreprise || `${a.fournisseur.nom} ${a.fournisseur.prenom || ''}`.trim())
                          : '—';
                        return (
                          <tr key={a.id} className="border-b border-gray-50">
                            <td className="px-4 py-3 text-gray-600">{formatDate(a.date)}</td>
                            <td className="px-4 py-3 text-gray-800">{a.designation}</td>
                            <td className="px-4 py-3 text-gray-500">{fourn}</td>
                            <td className="px-4 py-3 text-right font-mono text-gray-900">{formatEuros(a.montantHT)}</td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatEuros(a.montantTTC)}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td colSpan={4} className="px-4 py-3 font-bold text-gray-900">TOTAL {year}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 text-base">
                          {formatEuros(totalAchats)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 print:hidden">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Obligation legale :</span> Le registre des achats est obligatoire
              pour les activites d&apos;achat-revente. Il doit mentionner la date, la reference du justificatif,
              le fournisseur, la nature de l&apos;achat et le montant.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
