'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileCheck, Printer, AlertTriangle } from 'lucide-react';

type Entreprise = {
  nomEntreprise: string | null;
  siret: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  telephone: string | null;
};

type Chantier = {
  id: string;
  nom: string;
  adresse: string | null;
  ville: string | null;
  client: { id: string; nom: string; prenom: string | null; entreprise: string | null; adresse: string | null; codePostal: string | null; ville: string | null } | null;
};

export default function AttestationTvaPage() {
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [selectedChantier, setSelectedChantier] = useState('');
  const [tauxChoisi, setTauxChoisi] = useState<'10' | '5.5'>('10');
  const [loading, setLoading] = useState(true);

  // Champs supplementaires du formulaire
  const [natureImmeuble, setNatureImmeuble] = useState<'maison' | 'appartement' | 'autre'>('maison');
  const [dateAchevement, setDateAchevement] = useState('');
  const [natureTravaux, setNatureTravaux] = useState('');

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
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/documents" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attestation TVA simplifiee</h1>
            <p className="text-sm text-gray-500">Cerfa 1301-SD — Taux reduit de TVA pour travaux</p>
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

        {/* Taux */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Taux de TVA applicable</label>
          <div className="flex gap-2">
            <button onClick={() => setTauxChoisi('10')}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border min-h-[44px] transition-colors ${
                tauxChoisi === '10' ? 'bg-orange-50 border-orange-300 text-orange-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              10% — Renovation
            </button>
            <button onClick={() => setTauxChoisi('5.5')}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border min-h-[44px] transition-colors ${
                tauxChoisi === '5.5' ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              5,5% — Renovation energetique
            </button>
          </div>
        </div>

        {/* Chantier */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Chantier concerne</label>
          <select value={selectedChantier} onChange={(e) => setSelectedChantier(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base">
            <option value="">Selectionner un chantier...</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>{c.nom} {c.ville ? `(${c.ville})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Nature immeuble */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Nature de l&apos;immeuble</label>
          <div className="flex gap-2">
            {([
              { value: 'maison', label: 'Maison individuelle' },
              { value: 'appartement', label: 'Appartement' },
              { value: 'autre', label: 'Autre' },
            ] as const).map((opt) => (
              <button key={opt.value} onClick={() => setNatureImmeuble(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border min-h-[44px] transition-colors ${
                  natureImmeuble === opt.value ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date d'achevement */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Date d&apos;achevement du logement</label>
          <input type="date" value={dateAchevement} onChange={(e) => setDateAchevement(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base" />
          <p className="text-xs text-gray-400 mt-1">Doit etre acheve depuis plus de 2 ans pour beneficier du taux reduit</p>
        </div>

        {/* Nature des travaux */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Nature des travaux</label>
          <textarea value={natureTravaux} onChange={(e) => setNatureTravaux(e.target.value)}
            placeholder="Ex: Renovation salle de bain, remplacement plomberie et carrelage..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base resize-none" />
        </div>
      </div>

      {/* Apercu du document — version imprimable */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm print:shadow-none print:p-0 print:rounded-none">
        <div className="max-w-[700px] mx-auto space-y-6 text-sm text-gray-800">
          {/* Titre officiel */}
          <div className="text-center border-b-2 border-gray-800 pb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Cerfa 1301-SD</p>
            <h2 className="text-lg font-bold text-gray-900 mt-1">
              ATTESTATION SIMPLIFIEE
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              pour beneficier du taux reduit de TVA ({tauxChoisi === '10' ? '10%' : '5,5%'})
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Article 279-0 bis / 278-0 bis A du Code general des impots
            </p>
          </div>

          {/* Identite du client */}
          <div>
            <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider mb-2 border-b border-gray-200 pb-1">
              1. Identite du client (donneur d&apos;ordre)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Nom / Raison sociale :</span>
                <span className="ml-2 font-medium">{client ? (client.entreprise || `${client.nom} ${client.prenom || ''}`.trim()) : '______________________'}</span>
              </div>
              <div>
                <span className="text-gray-500">Adresse :</span>
                <span className="ml-2 font-medium">{client?.adresse || '______________________'}</span>
              </div>
              <div>
                <span className="text-gray-500">Code postal / Ville :</span>
                <span className="ml-2 font-medium">{client ? `${client.codePostal || ''} ${client.ville || ''}`.trim() || '______________________' : '______________________'}</span>
              </div>
            </div>
          </div>

          {/* Immeuble */}
          <div>
            <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider mb-2 border-b border-gray-200 pb-1">
              2. Nature et situation de l&apos;immeuble
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Adresse de l&apos;immeuble :</span>
                <span className="ml-2 font-medium">{chantier ? `${chantier.adresse || ''} ${chantier.ville || ''}`.trim() || '______________________' : '______________________'}</span>
              </div>
              <div>
                <span className="text-gray-500">Nature :</span>
                <span className="ml-2 font-medium">
                  {natureImmeuble === 'maison' ? 'Maison individuelle' : natureImmeuble === 'appartement' ? 'Appartement' : 'Autre'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Date d&apos;achevement :</span>
                <span className="ml-2 font-medium">{dateAchevement ? new Date(dateAchevement).toLocaleDateString('fr-FR') : '__ / __ / ____'}</span>
              </div>
            </div>
          </div>

          {/* Nature des travaux */}
          <div>
            <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider mb-2 border-b border-gray-200 pb-1">
              3. Nature des travaux
            </h3>
            <p className="text-sm">{natureTravaux || '______________________________________________________________________________________'}</p>
          </div>

          {/* Attestation */}
          <div>
            <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider mb-2 border-b border-gray-200 pb-1">
              4. Attestation
            </h3>
            <div className="space-y-3 text-sm">
              <p>
                Je soussigne(e), <span className="font-medium">{client ? (client.entreprise || `${client.nom} ${client.prenom || ''}`.trim()) : '____________________'}</span>,
                atteste que les travaux mentionnes ci-dessus se rapportent a un immeuble acheve depuis plus de deux ans
                a usage d&apos;habitation et ne repondent pas aux conditions ci-dessous :
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                <li>Travaux portant sur plus de 5 des 6 elements de second oeuvre</li>
                <li>Augmentation de plus de 10% de la surface de plancher</li>
                <li>Travaux de surelevation ou d&apos;addition de construction</li>
                <li>Remise a l&apos;etat neuf de plus de 2/3 de chacun des elements de second oeuvre</li>
              </ul>
            </div>
          </div>

          {/* Entreprise prestataire */}
          <div>
            <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider mb-2 border-b border-gray-200 pb-1">
              5. Entreprise prestataire
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Raison sociale :</span>
                <span className="ml-2 font-medium">{entreprise?.nomEntreprise || '____________________'}</span>
              </div>
              <div>
                <span className="text-gray-500">SIRET :</span>
                <span className="ml-2 font-medium font-mono">{entreprise?.siret || '____________________'}</span>
              </div>
              <div>
                <span className="text-gray-500">Adresse :</span>
                <span className="ml-2 font-medium">{entreprise ? `${entreprise.adresse || ''}, ${entreprise.codePostal || ''} ${entreprise.ville || ''}`.trim() : '____________________'}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-12">Signature du client</p>
              <p className="text-xs text-gray-400">Fait a ________________</p>
              <p className="text-xs text-gray-400 mt-1">Le {today}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-12">Signature de l&apos;entreprise</p>
              <p className="text-xs text-gray-400">Fait a {entreprise?.ville || '________________'}</p>
              <p className="text-xs text-gray-400 mt-1">Le {today}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 print:hidden">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Important :</span> Cette attestation doit etre signee par le client
            avant le debut des travaux. Elle doit etre conservee par l&apos;entreprise et le client pendant 5 ans.
            En cas de fausse attestation, le client est solidairement tenu au paiement du complement de taxe.
          </p>
        </div>
      </div>
    </div>
  );
}
