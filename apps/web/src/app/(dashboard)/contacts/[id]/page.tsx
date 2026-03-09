'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Phone, Mail, MapPin, Building2,
  FileText, Trash2, Edit3, Navigation, MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

type Contact = {
  id: string;
  type: string;
  nom: string;
  prenom: string | null;
  entreprise: string | null;
  telephone: string;
  email: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  siret: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
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

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/contacts/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(setContact)
      .catch(() => router.push('/contacts'))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleDelete() {
    if (!confirm('Supprimer ce contact ?')) return;
    setDeleting(true);
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    router.push('/contacts');
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-24 bg-gray-200 rounded-2xl" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!contact) return null;

  const fullName = `${contact.nom}${contact.prenom ? ` ${contact.prenom}` : ''}`;
  const fullAddress = [contact.adresse, contact.codePostal, contact.ville]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/contacts"
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[contact.type]}`}>
              {TYPE_LABELS[contact.type]}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/contacts/${id}/modifier`)}
            className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Modifier"
          >
            <Edit3 size={20} className="text-gray-600" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors"
            aria-label="Supprimer"
          >
            <Trash2 size={20} className="text-red-500" />
          </button>
        </div>
      </div>

      {/* Actions rapides — gros boutons tactiles */}
      <div className="grid grid-cols-4 gap-2">
        <a
          href={`tel:${contact.telephone}`}
          className="flex flex-col items-center gap-1.5 bg-green-50 rounded-2xl py-4
                     active:bg-green-100 transition-colors"
        >
          <Phone size={24} className="text-green-600" />
          <span className="text-xs font-medium text-green-700">Appeler</span>
        </a>
        <a
          href={`sms:${contact.telephone}`}
          className="flex flex-col items-center gap-1.5 bg-blue-50 rounded-2xl py-4
                     active:bg-blue-100 transition-colors"
        >
          <MessageSquare size={24} className="text-blue-600" />
          <span className="text-xs font-medium text-blue-700">SMS</span>
        </a>
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex flex-col items-center gap-1.5 bg-purple-50 rounded-2xl py-4
                       active:bg-purple-100 transition-colors"
          >
            <Mail size={24} className="text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Email</span>
          </a>
        )}
        {fullAddress && (
          <a
            href={`https://maps.apple.com/?q=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 bg-amber-50 rounded-2xl py-4
                       active:bg-amber-100 transition-colors"
          >
            <Navigation size={24} className="text-amber-600" />
            <span className="text-xs font-medium text-amber-700">GPS</span>
          </a>
        )}
      </div>

      {/* Informations */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">Informations</h2>

        {contact.entreprise && (
          <InfoRow icon={<Building2 size={18} />} label="Entreprise" value={contact.entreprise} />
        )}
        <InfoRow icon={<Phone size={18} />} label="Telephone" value={contact.telephone} />
        {contact.email && (
          <InfoRow icon={<Mail size={18} />} label="Email" value={contact.email} />
        )}
        {fullAddress && (
          <InfoRow icon={<MapPin size={18} />} label="Adresse" value={fullAddress} />
        )}
        {contact.siret && (
          <InfoRow icon={<FileText size={18} />} label="SIRET" value={contact.siret} />
        )}
      </div>

      {/* Notes */}
      {contact.notes && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-2">Notes</h2>
          <p className="text-gray-600 text-sm whitespace-pre-wrap">{contact.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
        <h2 className="font-semibold text-gray-900 mb-2">Actions</h2>
        <Link
          href={`/devis/nouveau?contactId=${contact.id}`}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100
                     transition-colors min-h-[48px]"
        >
          <FileText size={20} className="text-blue-600" />
          <span className="font-medium">Creer un devis</span>
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-gray-900">{value}</p>
      </div>
    </div>
  );
}
