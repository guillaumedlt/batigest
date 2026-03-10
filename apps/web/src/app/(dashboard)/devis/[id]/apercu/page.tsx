'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import Link from 'next/link';

type DevisLigne = {
  designation: string;
  description: string | null;
  quantite: string;
  unite: string;
  prixUnitaireHT: string;
  tauxTVA: string;
  totalHT: string;
  lot: string | null;
};

type DevisData = {
  id: string;
  numero: string;
  objet: string;
  statut: string;
  dateCreation: string;
  dateValidite: string;
  totalHT: string;
  totalTVA: string;
  totalTTC: string;
  remise: string | null;
  conditions: string | null;
  contact: {
    nom: string;
    prenom: string | null;
    entreprise: string | null;
    adresse: string | null;
    codePostal: string | null;
    ville: string | null;
    telephone: string;
    email: string | null;
  };
  lignes: DevisLigne[];
};

type Entreprise = {
  nomEntreprise: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
  siret: string | null;
  tvaIntracom: string | null;
  assuranceDecennale: string | null;
  assuranceNumero: string | null;
  rib: string | null;
  logoUrl: string | null;
  docCouleur: string;
  docPolice: string;
  franchiseTVA: boolean;
  mentionsDevis: string | null;
  conditionsReglement: string | null;
};

function fmt(val: string | number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(val));
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function DevisApercuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [devis, setDevis] = useState<DevisData | null>(null);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/devis/${id}`).then((r) => r.json()),
      fetch('/api/entreprise').then((r) => r.json()),
    ]).then(([d, e]) => {
      setDevis(d);
      setEntreprise(e);
    }).catch(() => router.push('/devis'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading || !devis || !entreprise) {
    return <div className="animate-pulse p-8"><div className="h-96 bg-gray-200 rounded-2xl" /></div>;
  }

  const contact = devis.contact;
  const contactName = contact.entreprise || `${contact.nom} ${contact.prenom || ''}`.trim();
  const contactAddr = [contact.adresse, contact.codePostal, contact.ville].filter(Boolean).join(', ');
  const accentColor = entreprise.docCouleur || '#2563EB';
  const fontFamily = entreprise.docPolice || 'Inter';

  // TVA par taux
  const tvaDetails: Record<string, { base: number; tva: number }> = {};
  devis.lignes.forEach((l) => {
    const t = l.tauxTVA;
    if (!tvaDetails[t]) tvaDetails[t] = { base: 0, tva: 0 };
    tvaDetails[t].base += Number(l.totalHT);
    tvaDetails[t].tva += Number(l.totalHT) * Number(l.tauxTVA) / 100;
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Actions bar — hidden on print */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link href={`/devis/${id}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={18} /> Retour au devis
        </Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: accentColor }}>
            <Printer size={16} /> Imprimer / PDF
          </button>
        </div>
      </div>

      {/* Document */}
      <div className="bg-white shadow-lg rounded-2xl print:rounded-none print:shadow-none p-4 sm:p-8 lg:p-12 print:p-0" style={{ fontFamily }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {entreprise.logoUrl && (
                <img src={entreprise.logoUrl} alt="" className="h-12 w-auto max-w-[120px] object-contain" />
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{entreprise.nomEntreprise}</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">{entreprise.adresse}</p>
            <p className="text-sm text-gray-500">{entreprise.codePostal} {entreprise.ville}</p>
            <p className="text-sm text-gray-500">Tél : {entreprise.telephone}</p>
            <p className="text-sm text-gray-500">{entreprise.email}</p>
            {entreprise.siret && <p className="text-xs text-gray-400 mt-2">SIRET : {entreprise.siret}</p>}
            {entreprise.tvaIntracom && <p className="text-xs text-gray-400">TVA : {entreprise.tvaIntracom}</p>}
          </div>
          <div className="sm:text-right">
            <h2 className="text-xl font-bold" style={{ color: accentColor }}>DEVIS</h2>
            <p className="text-lg font-semibold text-gray-900 mt-1">{devis.numero}</p>
            <p className="text-sm text-gray-500 mt-2">Date : {fmtDate(devis.dateCreation)}</p>
            <p className="text-sm text-gray-500">Validité : {fmtDate(devis.dateValidite)}</p>
          </div>
        </div>

        {/* Client */}
        <div className="mb-8 p-4 bg-gray-50 rounded-xl print:bg-transparent print:border print:border-gray-200">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Destinataire</p>
          <p className="font-semibold text-gray-900">{contactName}</p>
          {contactAddr && <p className="text-sm text-gray-600">{contactAddr}</p>}
          {contact.telephone && <p className="text-sm text-gray-500">Tél : {contact.telephone}</p>}
          {contact.email && <p className="text-sm text-gray-500">{contact.email}</p>}
        </div>

        {/* Objet */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Objet</p>
          <p className="font-medium text-gray-900">{devis.objet}</p>
        </div>

        {/* Lignes */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full mb-6 text-sm min-w-[500px]">
          <thead>
            <tr style={{ borderBottom: `2px solid ${accentColor}20` }}>
              <th className="text-left py-2 font-semibold text-gray-700">Désignation</th>
              <th className="text-right py-2 font-semibold text-gray-700 w-16">Qté</th>
              <th className="text-left py-2 font-semibold text-gray-700 w-14 pl-2">Unité</th>
              <th className="text-right py-2 font-semibold text-gray-700 w-24">PU HT</th>
              <th className="text-right py-2 font-semibold text-gray-700 w-16">TVA</th>
              <th className="text-right py-2 font-semibold text-gray-700 w-28">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes.map((l, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2">
                  <p className="text-gray-900">{l.designation}</p>
                  {l.description && <p className="text-xs text-gray-400">{l.description}</p>}
                </td>
                <td className="text-right py-2 text-gray-600">{Number(l.quantite)}</td>
                <td className="py-2 pl-2 text-gray-400">{l.unite}</td>
                <td className="text-right py-2 text-gray-600">{fmt(l.prixUnitaireHT)}</td>
                <td className="text-right py-2 text-gray-400">{Number(l.tauxTVA)}%</td>
                <td className="text-right py-2 font-medium text-gray-900">{fmt(l.totalHT)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Totaux */}
        <div className="flex justify-end mb-8">
          <div className="w-full sm:w-64 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total HT</span>
              <span className="font-medium">{fmt(devis.totalHT)}</span>
            </div>
            {Object.entries(tvaDetails).map(([taux, v]) => (
              <div key={taux} className="flex justify-between text-sm">
                <span className="text-gray-400">TVA {Number(taux)}%</span>
                <span className="text-gray-600">{fmt(v.tva)}</span>
              </div>
            ))}
            {devis.remise && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Remise</span>
                <span className="text-red-600">-{fmt(devis.remise)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t-2 border-gray-200">
              <span className="font-bold text-gray-900">Total TTC</span>
              <span className="text-xl font-bold" style={{ color: accentColor }}>{fmt(devis.totalTTC)}</span>
            </div>
          </div>
        </div>

        {/* Conditions */}
        {(devis.conditions || entreprise.conditionsReglement) && (
          <div className="mb-6 text-sm text-gray-600">
            <p className="font-semibold text-gray-700 mb-1">Conditions</p>
            <p className="whitespace-pre-wrap">{devis.conditions || entreprise.conditionsReglement}</p>
          </div>
        )}

        {/* Mentions légales */}
        <div className="border-t border-gray-200 pt-4 space-y-1 text-xs text-gray-400">
          {entreprise.franchiseTVA && (
            <p>TVA non applicable, art. 293 B du CGI</p>
          )}
          {entreprise.assuranceDecennale && (
            <p>Assurance décennale : {entreprise.assuranceDecennale} — N° {entreprise.assuranceNumero}</p>
          )}
          {entreprise.mentionsDevis && <p>{entreprise.mentionsDevis}</p>}
          <p className="mt-2">Devis valable jusqu&apos;au {fmtDate(devis.dateValidite)}. Signature précédée de la mention « Bon pour accord ».</p>
        </div>

        {/* Signature zone */}
        <div className="mt-8 flex justify-end">
          <div className="border border-dashed border-gray-300 rounded-xl p-6 w-full sm:w-64 text-center">
            <p className="text-xs text-gray-400 mb-8">Bon pour accord</p>
            <p className="text-xs text-gray-400">Date et signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
