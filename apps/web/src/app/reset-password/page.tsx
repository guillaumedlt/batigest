'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!token) {
      setError('Lien de reinitialisation invalide.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.');
        return;
      }

      // Rediriger vers login avec un message de succes
      router.push('/login');
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
          Lien de reinitialisation invalide ou manquant.
        </div>
        <Link
          href="/forgot-password"
          className="block w-full h-12 bg-blue-600 text-white font-semibold rounded-xl
                     hover:bg-blue-700 active:scale-[0.97] transition-all
                     flex items-center justify-center"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nouveau mot de passe
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-300 text-base
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Minimum 6 caracteres"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirmer le mot de passe
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-300 text-base
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Retapez le mot de passe"
          required
          minLength={6}
          autoComplete="new-password"
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
        Reinitialiser le mot de passe
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BatiGest</h1>
          <p className="text-gray-500 mt-2 text-base">
            Choisissez votre nouveau mot de passe
          </p>
        </div>

        <Suspense fallback={
          <div className="space-y-4 animate-pulse">
            <div className="h-12 bg-gray-200 rounded-xl" />
            <div className="h-12 bg-gray-200 rounded-xl" />
            <div className="h-12 bg-gray-200 rounded-xl" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-center mt-6 text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 font-medium hover:underline">
            Retour a la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
