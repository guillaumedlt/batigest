'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText, Calculator, BookOpen, ShoppingBag,
  FileCheck, Shield, Scale, Receipt, Building2,
  ChevronRight, ClipboardList, Landmark, ScrollText,
  Hammer, FolderOpen,
} from 'lucide-react';

type Entreprise = {
  regimeTVA: string;
  franchiseTVA: boolean;
  formeJuridique: string | null;
};

type DocumentCard = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: typeof FileText;
  iconColor: string;
  iconBg: string;
  href: string;
};

const CATEGORIES = [
  { value: '', label: 'Tous' },
  { value: 'fiscal', label: 'TVA & Fiscal' },
  { value: 'chantier', label: 'Chantier' },
  { value: 'admin', label: 'Administratif' },
  { value: 'auto', label: 'Auto-entrepreneur' },
];

function getDocuments(entreprise: Entreprise | null): DocumentCard[] {
  const isAutoEntrepreneur = entreprise?.formeJuridique === 'AUTO_ENTREPRENEUR'
    || entreprise?.formeJuridique === 'MICRO_ENTREPRISE'
    || entreprise?.franchiseTVA;

  const docs: DocumentCard[] = [
    // TVA & Fiscal
    {
      id: 'tva',
      title: 'Declaration TVA',
      description: 'CA3 ou CA12 pre-rempli depuis vos factures et achats',
      category: 'fiscal',
      icon: Calculator,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      href: '/documents/tva',
    },
    {
      id: 'livre-recettes',
      title: 'Livre des recettes',
      description: 'Registre chronologique de toutes vos factures encaissees',
      category: 'fiscal',
      icon: BookOpen,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      href: '/documents/livre-recettes',
    },
    {
      id: 'registre-achats',
      title: 'Registre des achats',
      description: 'Detail de tous vos achats par date et fournisseur',
      category: 'fiscal',
      icon: ShoppingBag,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50',
      href: '/documents/livre-recettes?tab=achats',
    },

    // Chantier
    {
      id: 'attestation-tva',
      title: 'Attestation TVA simplifiee',
      description: 'Cerfa 1301-SD pour travaux a taux reduit (5,5% ou 10%)',
      category: 'chantier',
      icon: FileCheck,
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50',
      href: '/documents/attestation-tva',
    },
    {
      id: 'pv-reception',
      title: 'PV de reception de travaux',
      description: 'Proces-verbal de fin de chantier signe par le client',
      category: 'chantier',
      icon: ClipboardList,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50',
      href: '/documents/pv-reception',
    },

    // Administratif
    {
      id: 'cgv',
      title: 'CGV Batiment',
      description: 'Conditions generales de vente pre-remplies pour le BTP',
      category: 'admin',
      icon: Scale,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      href: '/documents/cgv',
    },
    {
      id: 'assurance',
      title: 'Attestation assurance',
      description: 'Modele d\'attestation decennale et RC Pro a completer',
      category: 'admin',
      icon: Shield,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
      href: '/documents/cgv?section=assurance',
    },
  ];

  // Documents specifiques auto-entrepreneur
  if (isAutoEntrepreneur) {
    docs.push(
      {
        id: 'urssaf',
        title: 'Declaration CA URSSAF',
        description: 'Chiffre d\'affaires pre-calcule pour votre declaration',
        category: 'auto',
        icon: Landmark,
        iconColor: 'text-indigo-600',
        iconBg: 'bg-indigo-50',
        href: '/documents/urssaf',
      },
      {
        id: 'franchise-tva',
        title: 'Attestation franchise TVA',
        description: 'Mention legale obligatoire sur vos factures et devis',
        category: 'auto',
        icon: ScrollText,
        iconColor: 'text-pink-600',
        iconBg: 'bg-pink-50',
        href: '/documents/urssaf?section=franchise',
      },
    );
  }

  return docs;
}

export default function DocumentsPage() {
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/entreprise')
      .then((r) => r.json())
      .then((data) => { setEntreprise(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const documents = getDocuments(entreprise);
  const filtered = filterCategory
    ? documents.filter((d) => d.category === filterCategory)
    : documents;

  // Compter par categorie
  const counts: Record<string, number> = {};
  for (const d of documents) {
    counts[d.category] = (counts[d.category] || 0) + 1;
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-500 mt-1">
          Tous vos documents administratifs pre-remplis
        </p>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0">
        {CATEGORIES.map((cat) => {
          const count = cat.value ? counts[cat.value] || 0 : documents.length;
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                         min-h-[44px] transition-colors ${
                           filterCategory === cat.value
                             ? 'bg-blue-600 text-white'
                             : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                         }`}
            >
              {cat.label}
              <span className={`text-xs ${filterCategory === cat.value ? 'text-blue-200' : 'text-gray-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Documents grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-lg font-medium text-gray-500">Aucun document dans cette categorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((doc) => {
            const Icon = doc.icon;
            return (
              <Link
                key={doc.id}
                href={doc.href}
                className="flex items-start gap-4 bg-white rounded-2xl p-4 md:p-5 shadow-sm
                           hover:shadow-md active:bg-gray-50 transition-all group"
              >
                <div className={`w-12 h-12 ${doc.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} className={doc.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {doc.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{doc.description}</p>
                  <span className="inline-block mt-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {CATEGORIES.find((c) => c.value === doc.category)?.label}
                  </span>
                </div>
                <ChevronRight size={18} className="text-gray-300 mt-1 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 md:p-5">
        <div className="flex items-start gap-3">
          <Hammer size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900">Documents adaptes au batiment</p>
            <p className="text-sm text-blue-700 mt-1">
              Tous les documents sont pre-remplis avec les informations de votre entreprise
              et respectent la reglementation francaise en vigueur. Pensez a verifier vos
              informations dans les parametres avant de generer un document.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
