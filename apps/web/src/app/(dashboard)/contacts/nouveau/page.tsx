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

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Type de contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de contact *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((type) => (
              <label
                key={type.value}
                className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-xl p-3
                           cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50
                           transition-colors min-h-[48px]"
              >
                <input
                  type="radio"
                  name="type"
                  value={type.value}
                  defaultChecked={type.value === 'CLIENT'}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Nom et prenom */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <input
              type="text"
              name="nom"
              required
              className="w-full h-12 px-4 rounded-xl border border-gray-300 text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Dupont"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prenom
            </label>
            <input
              type="text"
              name="prenom"
              className="w-full h-12 px-4 rounded-xl border border-gray-300 text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Jean"
            />
          </div>
        </div>

        {/* Entreprise */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entreprise
          </label>
          <input
            type="text"
            name="entreprise"
            className="w-full h-12 px-4 rounded-xl border border-gray-300 text-base
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="SARL Dupont Plomberie"
          />
        </div>

        {/* Telephone et Email */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telephone *
            </label>
            <input
              type="tel"
              name="telephone"
              required
              className="w-full h-12 px-4 rounded-xl border border-gray-300 text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="06 12 34 56 78"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full h-12 px-4 rounded-xl border border-gray-300 text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="jean@email.fr"
            />
          </div>
        </div>

        {/* Adresse */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse
          </label>
          <input
            type="text"
            name="adresse"
            className="w-full h-12 px-4 rounded-xl border border-gray-300 text-base
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="12 rue de la Paix"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code postal
            </label>
            <input
              type="text"
              name="codePostal"
              className="w-full h-12 px-4 rounded-xl border border-gray-300 text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="75001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <input
              type="text"
              name="ville"
              className="w-full h-12 px-4 rounded-xl border border-gray-300 text-base
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paris"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base resize-none
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Notes sur ce contact..."
          />
        </div>

        {/* Bouton sauvegarder */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-blue-600 text-white font-semibold rounded-xl text-lg
                     hover:bg-blue-700 active:scale-[0.97] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 mt-6"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <Save size={20} />
          )}
          Enregistrer le contact
        </button>
      </form>
    </div>
  );
}
