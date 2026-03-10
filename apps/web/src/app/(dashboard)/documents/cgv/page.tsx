'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, Printer, Shield } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type Entreprise = {
  nomEntreprise: string | null;
  formeJuridique: string | null;
  siret: string | null;
  rcsRm: string | null;
  tvaIntracom: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  assuranceDecennale: string | null;
  assuranceNumero: string | null;
  assuranceZone: string | null;
  conditionsReglement: string | null;
  franchiseTVA: boolean;
};

export default function CgvPage() {
  return (
    <Suspense fallback={<div className="animate-pulse p-6"><div className="h-8 bg-gray-200 rounded w-1/3" /></div>}>
      <CgvPageInner />
    </Suspense>
  );
}

function CgvPageInner() {
  const searchParams = useSearchParams();
  const initialSection = searchParams.get('section') === 'assurance' ? 'assurance' : 'cgv';

  const [section, setSection] = useState<'cgv' | 'assurance'>(initialSection);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/entreprise')
      .then((r) => r.json())
      .then((data) => { setEntreprise(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const adresseComplete = entreprise
    ? `${entreprise.adresse || ''}, ${entreprise.codePostal || ''} ${entreprise.ville || ''}`.trim()
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
            <h1 className="text-2xl font-bold text-gray-900">
              {section === 'cgv' ? 'CGV Batiment' : 'Attestation assurance'}
            </h1>
            <p className="text-sm text-gray-500">
              {section === 'cgv' ? 'Conditions generales de vente pre-remplies' : 'Attestation decennale et RC Pro'}
            </p>
          </div>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors min-h-[44px]">
          <Printer size={16} /> <span className="hidden sm:inline">Imprimer</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 print:hidden">
        <button onClick={() => setSection('cgv')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
            section === 'cgv' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Scale size={16} /> CGV
        </button>
        <button onClick={() => setSection('assurance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
            section === 'assurance' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Shield size={16} /> Assurance
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full" />
            ))}
          </div>
        </div>
      ) : section === 'cgv' ? (
        /* CGV DOCUMENT */
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm print:shadow-none print:p-0 print:rounded-none">
          <div className="max-w-[700px] mx-auto space-y-6 text-sm text-gray-800 leading-relaxed">
            <div className="text-center border-b-2 border-gray-800 pb-4">
              <h2 className="text-lg font-bold text-gray-900">CONDITIONS GENERALES DE VENTE</h2>
              <p className="text-sm text-gray-600 mt-1">Travaux de batiment et prestations de services</p>
              <p className="font-medium mt-2">{entreprise?.nomEntreprise || '[Nom de l\'entreprise]'}</p>
              <p className="text-xs text-gray-500">SIRET : {entreprise?.siret || '_______________'} — {adresseComplete || '[Adresse]'}</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-1">Article 1 — Champ d&apos;application</h3>
              <p>Les presentes conditions generales de vente s&apos;appliquent a toutes les prestations de services et
              travaux de batiment realises par {entreprise?.nomEntreprise || '[Nom]'}, SIRET {entreprise?.siret || '_______________'},
              sise {adresseComplete || '[Adresse]'}. Toute commande implique l&apos;acceptation sans reserve des presentes CGV.</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-1">Article 2 — Devis et commande</h3>
              <p>Tout devis est valable 30 jours a compter de sa date d&apos;emission, sauf mention contraire.
              La commande est ferme et definitive a compter de la signature du devis par le client et du versement de
              l&apos;acompte prevu. Toute modification ulterieure fera l&apos;objet d&apos;un avenant ecrit.</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-1">Article 3 — Prix</h3>
              <p>Les prix sont indiques en euros hors taxes (HT).
              {entreprise?.franchiseTVA
                ? ' TVA non applicable, article 293 B du Code general des impots.'
                : ' La TVA applicable est celle en vigueur au jour de la facturation (20%, 10% ou 5,5% selon la nature des travaux).'}
              {' '}Les prix sont fermes pour la duree du devis. En cas de variation du cout des materiaux superieure a 5%,
              une revision pourra etre proposee.</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-1">Article 4 — Conditions de reglement</h3>
              <p>{entreprise?.conditionsReglement || 'Acompte de 30% a la commande. Solde a la reception des travaux, payable sous 30 jours.'}{' '}
              Conformement a l&apos;article L441-10 du Code de commerce, tout retard de paiement entraine de plein droit :</p>
              <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                <li>Des penalites de retard au taux de 3 fois le taux d&apos;interet legal</li>
                <li>Une indemnite forfaitaire pour frais de recouvrement de 40 EUR (art. D441-5)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-1">Article 5 — Delais d&apos;execution</h3>
              <p>Les delais de realisation sont donnes a titre indicatif et ne constituent pas un engagement ferme,
              sauf mention expresse dans le devis. Les retards lies aux intemperies, approvisionnement ou cas de force
              majeure ne peuvent donner lieu a indemnisation.</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-1">Article 6 — Reception des travaux</h3>
              <p>La reception est l&apos;acte par lequel le maitre d&apos;ouvrage accepte les travaux avec ou sans reserve.
              Elle est constatee par un proces-verbal de reception signe par les deux parties. A defaut de reception
              contradictoire dans les 8 jours suivant l&apos;achevement, les travaux sont reputes acceptes sans reserve.</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-1">Article 7 — Garanties</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="font-medium">Garantie de parfait achevement</span> : 1 an a compter de la reception (art. 1792-6 du Code civil)</li>
                <li><span className="font-medium">Garantie de bon fonctionnement</span> : 2 ans pour les equipements dissociables (art. 1792-3)</li>
                <li><span className="font-medium">Garantie decennale</span> : 10 ans pour les dommages compromettant la solidite de l&apos;ouvrage (art. 1792)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-1">Article 8 — Assurance</h3>
              <p>{entreprise?.nomEntreprise || '[Nom]'} est titulaire d&apos;une assurance de responsabilite civile decennale
              aupres de {entreprise?.assuranceDecennale || '[Nom de l\'assureur]'},
              contrat n° {entreprise?.assuranceNumero || '_______________'},
              couvrant la zone geographique : {entreprise?.assuranceZone || 'France metropolitaine'}.</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-1">Article 9 — Responsabilite</h3>
              <p>La responsabilite de l&apos;entreprise ne saurait etre engagee en cas d&apos;utilisation non conforme des
              ouvrages, de modifications realisees par le client ou un tiers sans accord prealable, ou de defaut
              d&apos;entretien des ouvrages par le client.</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-1">Article 10 — Litiges</h3>
              <p>En cas de litige, les parties s&apos;engagent a rechercher une solution amiable avant toute action
              judiciaire. A defaut d&apos;accord, le litige sera porte devant le tribunal competent du siege de l&apos;entreprise.
              Pour les litiges avec un consommateur, le client peut recourir gratuitement au service de mediation.</p>
            </div>

            {/* Pied de page */}
            <div className="border-t-2 border-gray-800 pt-4 mt-8 text-center text-xs text-gray-500">
              <p className="font-medium text-gray-700">{entreprise?.nomEntreprise || '[Nom]'}</p>
              <p>{adresseComplete} — Tel : {entreprise?.telephone || '_______________'} — Email : {entreprise?.email || '_______________'}</p>
              <p>SIRET : {entreprise?.siret || '_______________'}
                {entreprise?.rcsRm ? ` — ${entreprise.rcsRm}` : ''}
                {entreprise?.tvaIntracom ? ` — TVA : ${entreprise.tvaIntracom}` : ''}</p>
              <p className="mt-2 italic">Document mis a jour le {today}</p>
            </div>
          </div>
        </div>
      ) : (
        /* ATTESTATION ASSURANCE */
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm print:shadow-none print:p-0 print:rounded-none">
          <div className="max-w-[700px] mx-auto space-y-6 text-sm text-gray-800 leading-relaxed">
            <div className="text-center border-b-2 border-gray-800 pb-4">
              <h2 className="text-lg font-bold text-gray-900">ATTESTATION D&apos;ASSURANCE</h2>
              <p className="text-sm text-gray-600 mt-1">Responsabilite civile decennale et RC professionnelle</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Entreprise assuree</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p><span className="text-gray-500">Raison sociale :</span> <span className="font-medium">{entreprise?.nomEntreprise || '____________________'}</span></p>
                <p><span className="text-gray-500">Forme juridique :</span> <span className="font-medium">{entreprise?.formeJuridique || '____________________'}</span></p>
                <p><span className="text-gray-500">SIRET :</span> <span className="font-medium font-mono">{entreprise?.siret || '____________________'}</span></p>
                <p><span className="text-gray-500">Adresse :</span> <span className="font-medium">{adresseComplete || '____________________'}</span></p>
                <p><span className="text-gray-500">Metier :</span> <span className="font-medium">Batiment — Travaux de construction et renovation</span></p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Assurance de responsabilite civile decennale</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p><span className="text-gray-500">Compagnie d&apos;assurance :</span> <span className="font-medium">{entreprise?.assuranceDecennale || '____________________'}</span></p>
                <p><span className="text-gray-500">N° de contrat :</span> <span className="font-medium font-mono">{entreprise?.assuranceNumero || '____________________'}</span></p>
                <p><span className="text-gray-500">Zone de couverture :</span> <span className="font-medium">{entreprise?.assuranceZone || 'France metropolitaine'}</span></p>
                <p><span className="text-gray-500">Periode de validite :</span> <span className="font-medium">Du __ / __ / ____ au __ / __ / ____</span></p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Conformement aux articles L241-1 et L243-2 du Code des assurances, cette assurance couvre
                la responsabilite decennale de l&apos;entreprise pour les dommages compromettant la solidite de
                l&apos;ouvrage ou le rendant impropre a sa destination (article 1792 du Code civil).
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Garanties couvertes</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Responsabilite civile decennale (10 ans)</li>
                <li>Responsabilite civile professionnelle</li>
                <li>Garantie de bon fonctionnement (2 ans)</li>
                <li>Dommages en cours de chantier</li>
              </ul>
            </div>

            {/* Mention obligatoire */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Mention obligatoire sur vos devis et factures :</span><br />
                Assurance decennale souscrite aupres de {entreprise?.assuranceDecennale || '[Nom assureur]'},
                contrat n° {entreprise?.assuranceNumero || '[N° contrat]'},
                couvrant {entreprise?.assuranceZone || 'la France metropolitaine'}.
              </p>
            </div>

            {/* Signature */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-400">Fait a {entreprise?.ville || '________________'}</p>
                  <p className="text-xs text-gray-400">Le {today}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-8">Signature et cachet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
