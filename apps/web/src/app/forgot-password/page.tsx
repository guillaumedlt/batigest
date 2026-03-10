'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Une erreur est survenue.');
        return;
      }

      setSent(true);
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BatiGest</h1>
          <p className="text-gray-500 mt-2 text-base">
            Reinitialiser votre mot de passe
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm">
              Si un compte existe avec cet email, vous recevrez un lien de reinitialisation.
            </div>
            <Link
              href="/login"
              className="block w-full h-12 bg-blue-600 text-white font-semibold rounded-xl
                         hover:bg-blue-700 active:scale-[0.97] transition-all
                         flex items-center justify-center"
            >
              Retour a la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-300 text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="votre@email.fr"
                required
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 text-white font-semibold rounded-xl
                         hover:bg-blue-700 active:scale-[0.97] transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              Envoyer le lien
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 font-medium hover:underline">
            Retour a la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
