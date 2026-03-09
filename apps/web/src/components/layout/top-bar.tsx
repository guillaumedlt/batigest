'use client';

import { Search, Bell, User } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="hidden lg:flex items-center justify-between h-16 px-8 bg-white border-b border-gray-200 sticky top-0 z-40">
      {/* Recherche */}
      <div className="relative w-full max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un contact, devis, facture..."
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-gray-50 text-sm
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white
                     transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-gray-500" />
        </button>
        <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
        </button>
      </div>
    </header>
  );
}
