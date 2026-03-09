'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

type FactureLigne = {
  designation: string;
  description: string | null;
  quantite: string;
  unite: string;
  prixUnitaireHT: string;
  tauxTVA: string;
  totalHT: string;
};

type FactureData = {
  id: string;
  numero: string;
  type: string;
  statut: string;
  dateEmission: string;
  dateEcheance: string;
  totalHT: string;
  totalTVA: string;
  totalTTC: string;
  montantPaye: string;
  resteARegler: string;
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
  devis: { numero: string; objet: string } | null;
  lignes: FactureLigne[];
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
  franchiseTVA: boolean;
  mentionsFacture: string | null;
  conditionsReglement: string | null;
};

function fmt(val: string | number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(val));
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const TYPE_LABELS: Record<string, string> = {
  CLASSIQUE: 'FACTURE',
  ACOMPTE: 'FACTURE D\'ACOMPTE',
  SITUATION: 'FACTURE DE SITUATION',
  AVOIR: 'AVOIR',
};

export default function FactureApercuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [facture, setFacture] = useState<FactureData | null>(null);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/factures/${id}`).then((r) => r.json()),
      fetch('/api/entreprise').then((r) => r.json()),
    ]).then(([f, e]) => {
      setFacture(f);
      setEntreprise(e);
    }).catch(() => router.push('/factures'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading || !facture || !entreprise) {
    return <div className="animate-pulse p-8"><div className="h-96 bg-gray-200 rounded-2xl" /></div>;
  }

  const contact = facture.contact;
  const contactName = contact.entreprise || `${contact.nom} ${contact.prenom || ''}`.trim();
  const contactAddr = [contact.adresse, contact.codePostal, contact.ville].filter(Boolean).join(', ');

  const tvaDetails: Record<string, { base: number; tva: number }> = {};
  facture.lignes.forEach((l) => {
    const t = l.tauxTVA;
    if (!tvaDetails[t]) tvaDetails[t] = { base: 0, tva: 0 };
    tvaDetails[t].base += Number(l.totalHT);
    tvaDetails[t].tva += Number(l.totalHT) * Number(l.tauxTVA) / 100;
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link href={`/factures/${id}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={18} /> Retour
        </Link>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-xl text-sm font-medium text-white hover:bg-blue-700">
          <Printer size={16} /> Imprimer / PDF
        </button>
      </div>

      {/* Document */}
      <div className="bg-white shadow-lg rounded-2xl print:rounded-none print:shadow-none p-4 sm:p-8 lg:p-12 print:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{entreprise.nomEntreprise}</h1>
            <p className="text-sm text-gray-500 mt-1">{entreprise.adresse}</p>
            <p className="text-sm text-gray-500">{entreprise.codePostal} {entreprise.ville}</p>
            <p className="text-sm text-gray-500">Tél : {entreprise.telephone}</p>
            <p className="text-sm text-gray-500">{entreprise.email}</p>
            {entreprise.siret && <p className="text-xs text-gray-400 mt-2">SIRET : {entreprise.siret}</p>}
            {entreprise.tvaIntracom && <p className="text-xs text-gray-400">TVA : {entreprise.tvaIntracom}</p>}
          </div>
          <div className="sm:text-right">
            <h2 className="text-xl font-bold text-blue-600">{TYPE_LABELS[facture.type] || 'FACTURE'}</h2>
            <p className="text-lg font-semibold text-gray-900 mt-1">{facture.numero}</p>
            <p className="text-sm text-gray-500 mt-2">Date : {fmtDate(facture.dateEmission)}</p>
            <p className="text-sm text-gray-500">Échéance : {fmtDate(facture.dateEcheance)}</p>
          </div>
        </div>

        {/* Client */}
        <div className="mb-8 p-4 bg-gray-50 rounded-xl print:bg-transparent print:border print:border-gray-200">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Facturer à</p>
          <p className="font-semibold text-gray-900">{contactName}</p>
          {contactAddr && <p className="text-sm text-gray-600">{contactAddr}</p>}
          {contact.telephone && <p className="text-sm text-gray-500">Tél : {contact.telephone}</p>}
          {contact.email && <p className="text-sm text-gray-500">{contact.email}</p>}
        </div>

        {/* Reference devis */}
        {facture.devis && (
          <div className="mb-6 text-sm text-gray-500">
            Référence devis : {facture.devis.numero} — {facture.devis.objet}
          </div>
        )}

        {/* Lignes */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full mb-6 text-sm min-w-[500px]">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 font-semibold text-gray-700">Désignation</th>
              <th className="text-right py-2 font-semibold text-gray-700 w-16">Qté</th>
              <th className="text-left py-2 font-semibold text-gray-700 w-14 pl-2">Unité</th>
              <th className="text-right py-2 font-semibold text-gray-700 w-24">PU HT</th>
              <th className="text-right py-2 font-semibold text-gray-700 w-16">TVA</th>
              <th className="text-right py-2 font-semibold text-gray-700 w-28">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {facture.lignes.map((l, i) => (
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
              <span className="font-medium">{fmt(facture.totalHT)}</span>
            </div>
            {Object.entries(tvaDetails).map(([taux, v]) => (
              <div key={taux} className="flex justify-between text-sm">
                <span className="text-gray-400">TVA {Number(taux)}%</span>
                <span className="text-gray-600">{fmt(v.tva)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t-2 border-gray-200">
              <span className="font-bold text-gray-900">Total TTC</span>
              <span className="text-xl font-bold text-blue-600">{fmt(facture.totalTTC)}</span>
            </div>
            {Number(facture.montantPaye) > 0 && (
              <>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-gray-400">Déjà réglé</span>
                  <span className="text-green-600">-{fmt(facture.montantPaye)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Reste à régler</span>
                  <span className="text-red-600">{fmt(facture.resteARegler)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Conditions */}
        {(facture.conditions || entreprise.conditionsReglement) && (
          <div className="mb-6 text-sm text-gray-600">
            <p className="font-semibold text-gray-700 mb-1">Conditions de règlement</p>
            <p className="whitespace-pre-wrap">{facture.conditions || entreprise.conditionsReglement}</p>
          </div>
        )}

        {/* RIB */}
        {entreprise.rib && (
          <div className="mb-6 p-3 bg-gray-50 rounded-xl print:bg-transparent print:border print:border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Coordonnées bancaires</p>
            <p className="text-sm font-mono text-gray-700">{entreprise.rib}</p>
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
          {entreprise.mentionsFacture && <p>{entreprise.mentionsFacture}</p>}
          <p>En cas de retard de paiement, une pénalité de 3 fois le taux d&apos;intérêt légal sera appliquée, ainsi qu&apos;une indemnité forfaitaire de 40 € pour frais de recouvrement.</p>
        </div>
      </div>
    </div>
  );
}
