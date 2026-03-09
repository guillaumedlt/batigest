'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Users,
  FileText,
  Receipt,
  ShoppingCart,
  Calculator,
  Calendar,
  Wallet,
  Globe,
  Settings,
} from 'lucide-react';

const mainNav = [
  { href: '/', label: 'Tableau de bord', icon: Home },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/devis', label: 'Devis', icon: FileText },
  { href: '/factures', label: 'Factures', icon: Receipt },
];

const secondaryNav = [
  { href: '/achats', label: 'Achats', icon: ShoppingCart },
  { href: '/tva', label: 'TVA', icon: Calculator },
  { href: '/calendrier', label: 'Calendrier', icon: Calendar },
  { href: '/frais', label: 'Notes de frais', icon: Wallet },
  { href: '/mini-site', label: 'Mini-site', icon: Globe },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="text-xl font-bold text-gray-900">BatiGest</span>
        </Link>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Principal
        </p>
        {mainNav.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                         transition-colors ${
                           active
                             ? 'bg-blue-50 text-blue-700'
                             : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                         }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Gestion
          </p>
          {secondaryNav.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                           transition-colors ${
                             active
                               ? 'bg-blue-50 text-blue-700'
                               : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                           }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Parametres en bas */}
      <div className="px-3 py-4 border-t border-gray-100">
        <Link
          href="/parametres"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                     transition-colors ${
                       isActive('/parametres')
                         ? 'bg-blue-50 text-blue-700'
                         : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                     }`}
        >
          <Settings size={20} />
          Parametres
        </Link>
      </div>
    </aside>
  );
}
