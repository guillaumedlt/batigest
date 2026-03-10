'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, Printer } from 'lucide-react';

type Entreprise = {
  nomEntreprise: string | null;
  siret: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  telephone: string | null;
  assuranceDecennale: string | null;
  assuranceNumero: string | null;
};

type Chantier = {
  id: string;
  nom: string;
  adresse: string | null;
  ville: string | null;
  client: {
    id: string;
    nom: string;
    prenom: string | null;
    entreprise: string | null;
    adresse: string | null;
    codePostal: string | null;
    ville: string | null;
  } | null;
};

export default function PvReceptionPage() {
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [selectedChantier, setSelectedChantier] = useState('');
  const [loading, setLoading] = useState(true);

  // Champs du PV
  const [dateReception, setDateReception] = useState(new Date().toISOString().split('T')[0]);
  const [avecReserves, setAvecReserves] = useState(false);
  const [reserves, setReserves] = useState('');
  const [delaiLevee, setDelaiLevee] = useState('30');
  const [observations, setObservations] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/entreprise').then((r) => r.json()),
      fetch('/api/chantiers').then((r) => r.json()),
    ]).then(([ent, ch]) => {
      setEntreprise(ent);
      setChantiers(Array.isArray(ch) ? ch : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const chantier = chantiers.find((c) => c.id === selectedChantier);
  const client = chantier?.client;
  const clientNom = client
    ? (client.entreprise || `${client.nom} ${client.prenom || ''}`.trim())
    : '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/documents" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PV de reception</h1>
            <p className="text-sm text-gray-500">Proces-verbal de reception de travaux</p>
          </div>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors min-h-[44px]">
          <Printer size={16} /> <span className="hidden sm:inline">Imprimer</span>
        </button>
      </div>

      {/* Configuration — hidden on print */}
      <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm space-y-4 print:hidden">
        <h2 className="font-semibold text-gray-900">Parametres du document</h2>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Chantier</label>
          <select value={selectedChantier} onChange={(e) => setSelectedChantier(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base">
            <option value="">Selectionner un chantier...</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>{c.nom} {c.ville ? `(${c.ville})` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Date de reception</label>
          <input type="date" value={dateReception} onChange={(e) => setDateReception(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Reception</label>
          <div className="flex gap-2">
            <button onClick={() => setAvecReserves(false)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border min-h-[44px] transition-colors ${
                !avecReserves ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-600'}`}>
              Sans reserves
            </button>
            <button onClick={() => setAvecReserves(true)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border min-h-[44px] transition-colors ${
                avecReserves ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-gray-200 text-gray-600'}`}>
              Avec reserves
            </button>
          </div>
        </div>

        {avecReserves && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Reserves</label>
              <textarea value={reserves} onChange={(e) => setReserves(e.target.value)}
                placeholder="Decrire les reserves constatees..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Delai de levee des reserves (jours)</label>
              <input type="number" value={delaiLevee} onChange={(e) => setDelaiLevee(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base" />
            </div>
          </>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Observations</label>
          <textarea value={observations} onChange={(e) => setObservations(e.target.value)}
            placeholder="Observations complementaires (optionnel)..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base resize-none" />
        </div>
      </div>

      {/* Apercu du document */}
      {loading ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-gray-200 rounded w-full" />)}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm print:shadow-none print:p-0 print:rounded-none">
          <div className="max-w-[700px] mx-auto space-y-6 text-sm text-gray-800 leading-relaxed">
            {/* Titre */}
            <div className="text-center border-b-2 border-gray-800 pb-4">
              <h2 className="text-lg font-bold text-gray-900">
                PROCES-VERBAL DE RECEPTION DE TRAVAUX
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {avecReserves ? 'Reception avec reserves' : 'Reception sans reserve'}
              </p>
            </div>

            {/* Chantier */}
            <div>
              <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider mb-2 border-b border-gray-200 pb-1">
                Designation du chantier
              </h3>
              <div className="space-y-1">
                <p><span className="text-gray-500">Designation :</span> <span className="font-medium">{chantier?.nom || '____________________'}</span></p>
                <p><span className="text-gray-500">Adresse :</span> <span className="font-medium">{chantier ? `${chantier.adresse || ''} ${chantier.ville || ''}`.trim() || '____________________' : '____________________'}</span></p>
                <p><span className="text-gray-500">Date de reception :</span> <span className="font-medium">{dateReception ? new Date(dateReception).toLocaleDateString('fr-FR') : '__ / __ / ____'}</span></p>
              </div>
            </div>

            {/* Maitre d'ouvrage */}
            <div>
              <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider mb-2 border-b border-gray-200 pb-1">
                Maitre d&apos;ouvrage (client)
              </h3>
              <div className="space-y-1">
                <p><span className="text-gray-500">Nom / Raison sociale :</span> <span className="font-medium">{clientNom || '____________________'}</span></p>
                <p><span className="text-gray-500">Adresse :</span> <span className="font-medium">{client ? `${client.adresse || ''}, ${client.codePostal || ''} ${client.ville || ''}`.trim() : '____________________'}</span></p>
              </div>
            </div>

            {/* Entreprise */}
            <div>
              <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider mb-2 border-b border-gray-200 pb-1">
                Entreprise
              </h3>
              <div className="space-y-1">
                <p><span className="text-gray-500">Raison sociale :</span> <span className="font-medium">{entreprise?.nomEntreprise || '____________________'}</span></p>
                <p><span className="text-gray-500">SIRET :</span> <span className="font-medium font-mono">{entreprise?.siret || '____________________'}</span></p>
                <p><span className="text-gray-500">Assurance decennale :</span> <span className="font-medium">{entreprise?.assuranceDecennale || '____________________'}, n° {entreprise?.assuranceNumero || '____________________'}</span></p>
              </div>
            </div>

            {/* Decision */}
            <div>
              <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider mb-2 border-b border-gray-200 pb-1">
                Decision
              </h3>
              {avecReserves ? (
                <div className="space-y-3">
                  <p>Le maitre d&apos;ouvrage prononce la reception des travaux <span className="font-bold">avec les reserves suivantes</span> :</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="whitespace-pre-wrap">{reserves || '____________________________________________________________________________________'}</p>
                  </div>
                  <p>L&apos;entreprise s&apos;engage a lever les reserves dans un delai de <span className="font-semibold">{delaiLevee} jours</span> a compter de la date du present proces-verbal.</p>
                </div>
              ) : (
                <p>Le maitre d&apos;ouvrage prononce la reception des travaux <span className="font-bold">sans reserve</span>.
                Les travaux sont conformes au devis / contrat et aux regles de l&apos;art.</p>
              )}
            </div>

            {/* Observations */}
            {observations && (
              <div>
                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider mb-2 border-b border-gray-200 pb-1">
                  Observations
                </h3>
                <p className="whitespace-pre-wrap">{observations}</p>
              </div>
            )}

            {/* Effets juridiques */}
            <div>
              <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider mb-2 border-b border-gray-200 pb-1">
                Effets juridiques
              </h3>
              <p>La reception constitue le point de depart :</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>De la <span className="font-medium">garantie de parfait achevement</span> (1 an — art. 1792-6 du Code civil)</li>
                <li>De la <span className="font-medium">garantie de bon fonctionnement</span> (2 ans — art. 1792-3)</li>
                <li>De la <span className="font-medium">garantie decennale</span> (10 ans — art. 1792)</li>
              </ul>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-gray-800">
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900 mb-1">Le maitre d&apos;ouvrage</p>
                <p className="text-xs text-gray-500 mb-12">(Lu et approuve, bon pour reception{avecReserves ? ' avec reserves' : ''})</p>
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-xs text-gray-400">{clientNom || 'Nom et signature'}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900 mb-1">L&apos;entreprise</p>
                <p className="text-xs text-gray-500 mb-12">(Signature et cachet)</p>
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-xs text-gray-400">{entreprise?.nomEntreprise || 'Nom et signature'}</p>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-gray-400 pt-4">
              <p>Fait en deux exemplaires a {chantier?.ville || entreprise?.ville || '________________'},</p>
              <p>le {dateReception ? new Date(dateReception).toLocaleDateString('fr-FR') : '__ / __ / ____'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
