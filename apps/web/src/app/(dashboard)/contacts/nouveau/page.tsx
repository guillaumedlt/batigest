'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

const TYPES = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'PROSPECT', label: 'Prospect' },
  { value: 'FOURNISSEUR', label: 'Fournisseur' },
  { value: 'SOUS_TRAITANT', label: 'Sous-traitant' },
];

function FormField({ name, label, placeholder, type = 'text', required = false }: {
  name: string; label: string; placeholder: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} name={name} required={required} placeholder={placeholder}
        className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
    </div>
  );
}

export default function NouveauContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      type: formData.get('type'),
      nom: formData.get('nom'),
      prenom: formData.get('prenom') || null,
      entreprise: formData.get('entreprise') || null,
      telephone: formData.get('telephone'),
      email: formData.get('email') || null,
      adresse: formData.get('adresse') || null,
      codePostal: formData.get('codePostal') || null,
      ville: formData.get('ville') || null,
      notes: formData.get('notes') || null,
    };

    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || 'Une erreur est survenue');
      setLoading(false);
      return;
    }

    router.push('/contacts');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/contacts"
          className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nouveau contact</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 space-y-5">
          {/* Type de contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de contact *
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-xl p-3
                             cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50
                             transition-colors min-h-[48px]"
                >
                  <input type="radio" name="type" value={type.value}
                    defaultChecked={type.value === 'CLIENT'} className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Identite — 3 colonnes desktop */}
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Identite</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <FormField name="nom" label="Nom *" placeholder="Dupont" required />
              <FormField name="prenom" label="Prenom" placeholder="Jean" />
              <FormField name="entreprise" label="Entreprise" placeholder="SARL Dupont Plomberie" />
            </div>
          </div>

          {/* Coordonnees — 2 colonnes desktop */}
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Coordonnees</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <FormField name="telephone" label="Telephone *" placeholder="06 12 34 56 78" type="tel" required />
              <FormField name="email" label="Email" placeholder="jean@email.fr" type="email" />
            </div>
          </div>

          {/* Adresse — grille adaptative */}
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Adresse</p>
            <div className="space-y-3">
              <FormField name="adresse" label="Rue" placeholder="12 rue de la Paix" />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <FormField name="codePostal" label="Code postal" placeholder="75001" />
                <div className="col-span-1 lg:col-span-2">
                  <FormField name="ville" label="Ville" placeholder="Paris" />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base resize-none
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notes sur ce contact..." />
          </div>
        </div>

        {/* Boutons — sticky en bas sur mobile, inline sur desktop */}
        <div className="sticky bottom-16 lg:static bg-gray-50 lg:bg-transparent pt-4 pb-2 lg:pb-0 flex gap-3">
          <Link href="/contacts"
            className="hidden lg:flex items-center justify-center px-6 h-12 border border-gray-200 rounded-xl
                       text-gray-700 font-medium hover:bg-gray-50 transition-colors">
            Annuler
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 lg:flex-none h-14 lg:h-12 bg-blue-600 text-white font-semibold rounded-xl text-lg lg:text-base
                       lg:px-8 hover:bg-blue-700 active:scale-[0.97] transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2">
            {loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : <Save size={20} />}
            Enregistrer le contact
          </button>
        </div>
      </form>
    </div>
  );
}
