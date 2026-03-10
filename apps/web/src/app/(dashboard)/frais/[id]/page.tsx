'use client';

import { useState, useEffect, use } from 'react';
import {
  ArrowLeft, Edit, Save, Trash2, X, Wallet, Car, Utensils, ParkingCircle,
  Package, CircleDollarSign, Calendar, MapPin, CheckCircle2, FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type NoteFrais = {
  id: string;
  date: string;
  categorie: string;
  montant: string;
  tva: string | null;
  km: string | null;
  description: string;
  remboursee: boolean;
  chantierId: string | null;
  chantier: { id: string; nom: string } | null;
  justificatifUrl: string | null;
  createdAt: string;
};

type ChantierOption = {
  id: string;
  nom: string;
  statut: string;
};

const CATEGORIES = [
  { value: 'CARBURANT', label: 'Carburant' },
  { value: 'PEAGE', label: 'Peage' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'FOURNITURES', label: 'Fournitures' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'KILOMETRIQUE', label: 'Indemnite km' },
  { value: 'AUTRE', label: 'Autre' },
];

const CATEGORIE_LABELS: Record<string, string> = {
  CARBURANT: 'Carburant',
  PEAGE: 'Peage',
  RESTAURANT: 'Restaurant',
  FOURNITURES: 'Fournitures',
  PARKING: 'Parking',
  KILOMETRIQUE: 'Kilometrique',
  AUTRE: 'Autre',
};

const CATEGORIE_COLORS: Record<string, string> = {
  CARBURANT: 'bg-red-100 text-red-700',
  PEAGE: 'bg-blue-100 text-blue-700',
  RESTAURANT: 'bg-orange-100 text-orange-700',
  FOURNITURES: 'bg-purple-100 text-purple-700',
  PARKING: 'bg-cyan-100 text-cyan-700',
  KILOMETRIQUE: 'bg-green-100 text-green-700',
  AUTRE: 'bg-gray-100 text-gray-600',
};

const CATEGORIE_ICONS: Record<string, typeof Wallet> = {
  CARBURANT: CircleDollarSign,
  PEAGE: CircleDollarSign,
  RESTAURANT: Utensils,
  FOURNITURES: Package,
  PARKING: ParkingCircle,
  KILOMETRIQUE: Car,
  AUTRE: Wallet,
};

function formatEuros(value: string | number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function FraisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [note, setNote] = useState<NoteFrais | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chantiers, setChantiers] = useState<ChantierOption[]>([]);

  // Form state for edit mode
  const [form, setForm] = useState({
    description: '',
    montant: '',
    categorie: '',
    date: '',
    chantierId: '',
    remboursee: false,
  });

  useEffect(() => {
    fetch(`/api/frais/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push('/frais');
          return;
        }
        setNote(data);
        setForm({
          description: data.description || '',
          montant: String(data.montant || ''),
          categorie: data.categorie || 'AUTRE',
          date: data.date ? data.date.split('T')[0] : '',
          chantierId: data.chantierId || '',
          remboursee: data.remboursee || false,
        });
        setLoading(false);
      });
  }, [id, router]);

  // Charger les chantiers quand on passe en mode edition
  useEffect(() => {
    if (editing && chantiers.length === 0) {
      fetch('/api/chantiers')
        .then((r) => r.json())
        .then((data) => setChantiers(data));
    }
  }, [editing, chantiers.length]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload: Record<string, unknown> = {
      description: form.description,
      date: form.date,
      categorie: form.categorie,
      montant: Number(form.montant),
      chantierId: form.chantierId || null,
      remboursee: form.remboursee,
    };

    const res = await fetch(`/api/frais/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const updated = await res.json();
      setNote({ ...note, ...updated });
      setEditing(false);
    } else {
      const err = await res.json();
      alert(err.error || 'Erreur lors de la sauvegarde.');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('Supprimer cette note de frais ?')) return;
    const res = await fetch(`/api/frais/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/frais');
  }

  async function toggleRembourse() {
    if (!note) return;
    const res = await fetch(`/api/frais/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remboursee: !note.remboursee }),
    });
    if (res.ok) {
      const updated = await res.json();
      setNote({ ...note, ...updated, remboursee: !note.remboursee });
      setForm((f) => ({ ...f, remboursee: !note.remboursee }));
    }
  }

  function cancelEdit() {
    if (note) {
      setForm({
        description: note.description || '',
        montant: String(note.montant || ''),
        categorie: note.categorie || 'AUTRE',
        date: note.date ? note.date.split('T')[0] : '',
        chantierId: note.chantierId || '',
        remboursee: note.remboursee || false,
      });
    }
    setEditing(false);
  }

  // Loading state
  if (loading || !note) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  const CatIcon = CATEGORIE_ICONS[note.categorie] || Wallet;

  // ---- MODE EDITION ----
  if (editing) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={cancelEdit} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Modifier la note de frais</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <input
                type="text"
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie *</label>
                <select
                  value={form.categorie}
                  onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
              <select
                value={form.chantierId}
                onChange={(e) => setForm({ ...form, chantierId: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Aucun chantier</option>
                {chantiers.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="remboursee"
                checked={form.remboursee}
                onChange={(e) => setForm({ ...form, remboursee: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remboursee" className="text-sm font-medium text-gray-700">
                Remboursee
              </label>
            </div>
          </div>

          {/* Boutons de sauvegarde */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || !form.description || !form.montant}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white
                         px-4 py-3.5 rounded-xl font-semibold text-sm
                         active:scale-95 transition-transform disabled:opacity-50 disabled:pointer-events-none"
            >
              <Save size={16} />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-600
                         px-4 py-3.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
            >
              <X size={16} />
              Annuler
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ---- MODE CONSULTATION ----
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/frais" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{note.description}</h1>
            <p className="text-sm text-gray-500">{formatDate(note.date)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white
                     px-4 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
        >
          <Edit size={16} />
          Modifier
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center justify-center gap-2 bg-red-50 text-red-600
                     px-4 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
        >
          <Trash2 size={16} />
          Supprimer
        </button>
      </div>

      {/* Infos principales */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${CATEGORIE_COLORS[note.categorie]}`}>
            <CatIcon size={24} />
          </div>
          <div>
            <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-medium ${CATEGORIE_COLORS[note.categorie]}`}>
              <CatIcon size={14} />
              {CATEGORIE_LABELS[note.categorie]}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Calendar size={16} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium text-gray-900">{formatDate(note.date)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText size={16} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium text-gray-900">{note.description}</p>
            </div>
          </div>

          {note.km && (
            <div className="flex items-start gap-3">
              <Car size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Kilometres</p>
                <p className="font-medium text-gray-900">{note.km} km</p>
              </div>
            </div>
          )}

          {note.chantier && (
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Chantier</p>
                <Link href={`/chantiers/${note.chantier.id}`} className="font-medium text-blue-600 hover:underline">
                  {note.chantier.nom}
                </Link>
              </div>
            </div>
          )}

          {note.justificatifUrl && (
            <div className="flex items-start gap-3">
              <FileText size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Justificatif</p>
                <a
                  href={note.justificatifUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Voir le justificatif
                </a>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className={`mt-0.5 ${note.remboursee ? 'text-green-500' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm text-gray-500">Statut de remboursement</p>
              <button
                onClick={toggleRembourse}
                className={`font-medium ${note.remboursee ? 'text-green-600' : 'text-orange-600 hover:underline'}`}
              >
                {note.remboursee ? 'Remboursee' : 'Non remboursee — marquer comme remboursee'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Montant */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Montant</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Montant</span>
            <span className="font-medium text-gray-900">{formatEuros(note.montant)}</span>
          </div>
          {note.tva && Number(note.tva) > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">TVA recuperable</span>
              <span className="font-medium text-gray-900">{formatEuros(note.tva)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t border-gray-100">
            <span className="font-semibold text-gray-900 text-lg">Total</span>
            <span className="font-bold text-gray-900 text-lg">{formatEuros(note.montant)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
