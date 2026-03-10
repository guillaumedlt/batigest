'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingCart,
  Library,
  FolderOpen,
  Calendar,
  Wallet,
  Globe,
  Settings,
  Users,
  ChevronRight,
} from 'lucide-react';

const items = [
  { href: '/contacts', label: 'Contacts', desc: 'Clients, fournisseurs, sous-traitants', icon: Users },
  { href: '/achats', label: 'Achats', desc: 'Materiaux, outillage, location', icon: ShoppingCart },
  { href: '/prestations', label: 'Prestations', desc: 'Bibliotheque de prestations', icon: Library },
  { href: '/frais', label: 'Notes de frais', desc: 'Carburant, peages, repas', icon: Wallet },
  { href: '/calendrier', label: 'Calendrier', desc: 'Rendez-vous et evenements', icon: Calendar },
  { href: '/documents', label: 'Documents', desc: 'TVA, attestations, CGV, URSSAF...', icon: FolderOpen },
  { href: '/mini-site', label: 'Mini-site', desc: 'Votre vitrine en ligne', icon: Globe },
  { href: '/parametres', label: 'Parametres', desc: 'Entreprise, mentions legales', icon: Settings },
];

export default function PlusPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Plus</h1>

      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm
                         active:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon size={22} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
              <ChevronRight size={20} className="text-gray-300 flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
