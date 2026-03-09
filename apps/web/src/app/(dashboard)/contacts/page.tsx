'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Phone, Mail, Building2, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type Contact = {
  id: string;
  type: string;
  nom: string;
  prenom: string | null;
  entreprise: string | null;
  telephone: string;
  email: string | null;
  ville: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  CLIENT: 'Client',
  PROSPECT: 'Prospect',
  FOURNISSEUR: 'Fournisseur',
  SOUS_TRAITANT: 'Sous-traitant',
};

const TYPE_COLORS: Record<string, string> = {
  CLIENT: 'bg-green-100 text-green-700',
  PROSPECT: 'bg-blue-100 text-blue-700',
  FOURNISSEUR: 'bg-amber-100 text-amber-700',
  SOUS_TRAITANT: 'bg-purple-100 text-purple-700',
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, [search, filterType]);

  async function fetchContacts() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterType) params.set('type', filterType);

    const res = await fetch(`/api/contacts?${params}`);
    const data = await res.json();
    setContacts(data);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <Link
          href="/contacts/nouveau"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl
                     font-semibold text-sm active:scale-95 transition-transform min-h-[44px]"
        >
          <Plus size={18} />
          Ajouter
        </Link>
      </div>

      {/* Recherche + filtres */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un contact..."
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-base
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
          {['', 'CLIENT', 'PROSPECT', 'FOURNISSEUR', 'SOUS_TRAITANT'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 lg:px-4 lg:py-2.5 rounded-full text-sm font-medium whitespace-nowrap min-h-[36px] lg:min-h-[44px]
                         transition-colors ${
                           filterType === type
                             ? 'bg-blue-600 text-white'
                             : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                         }`}
            >
              {type === '' ? 'Tous' : TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des contacts */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12">
          <User size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-lg font-medium text-gray-500">Aucun contact</p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Aucun resultat pour cette recherche' : 'Ajoutez votre premier client !'}
          </p>
          {!search && (
            <Link
              href="/contacts/nouveau"
              className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white
                         px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              <Plus size={18} />
              Ajouter un contact
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Vue TABLEAU — desktop */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Nom</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Entreprise</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Telephone</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Ville</th>
                  <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/contacts/${contact.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-bold text-sm">{contact.nom[0].toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {contact.nom}{contact.prenom ? ` ${contact.prenom}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_COLORS[contact.type]}`}>
                        {TYPE_LABELS[contact.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{contact.entreprise || '—'}</td>
                    <td className="px-6 py-4">
                      <a
                        href={`tel:${contact.telephone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {contact.telephone}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          {contact.email}
                        </a>
                      ) : <span className="text-sm text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{contact.ville || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${contact.telephone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-green-50 transition-colors"
                          aria-label="Appeler"
                        >
                          <Phone size={16} className="text-green-600" />
                        </a>
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            aria-label="Email"
                          >
                            <Mail size={16} className="text-blue-600" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vue CARDS — mobile */}
          <div className="lg:hidden space-y-2">
            {contacts.map((contact) => (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm
                           active:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-lg">{contact.nom[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">
                      {contact.nom}{contact.prenom ? ` ${contact.prenom}` : ''}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[contact.type]}`}>
                      {TYPE_LABELS[contact.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    {contact.entreprise && (
                      <span className="flex items-center gap-1 truncate">
                        <Building2 size={14} />{contact.entreprise}
                      </span>
                    )}
                    {contact.ville && <span className="truncate">{contact.ville}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a href={`tel:${contact.telephone}`} onClick={(e) => e.stopPropagation()}
                     className="p-2 rounded-full hover:bg-green-50 active:bg-green-100" aria-label="Appeler">
                    <Phone size={20} className="text-green-600" />
                  </a>
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} onClick={(e) => e.stopPropagation()}
                       className="p-2 rounded-full hover:bg-blue-50 active:bg-blue-100" aria-label="Email">
                      <Mail size={20} className="text-blue-600" />
                    </a>
                  )}
                  <ChevronRight size={20} className="text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
