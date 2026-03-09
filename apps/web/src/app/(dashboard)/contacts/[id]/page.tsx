'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Phone, Mail, MapPin, Building2,
  FileText, Trash2, Edit3, Navigation, MessageSquare, Receipt, Hammer,
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
  devis: { id: string; numero: string; objet: string; statut: string; totalTTC: string; dateCreation: string }[];
  factures: { id: string; numero: string; type: string; statut: string; totalTTC: string; resteARegler: string; dateEmission: string }[];
  chantiers: { id: string; nom: string; statut: string; dateDebut: string | null }[];
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

const DEVIS_STATUT: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-600',
  ENVOYE: 'bg-blue-100 text-blue-700',
  ACCEPTE: 'bg-green-100 text-green-700',
  REFUSE: 'bg-red-100 text-red-700',
  EXPIRE: 'bg-amber-100 text-amber-700',
};

const FACTURE_STATUT: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-600',
  EMISE: 'bg-blue-100 text-blue-700',
  PAYEE_PARTIELLEMENT: 'bg-amber-100 text-amber-700',
  PAYEE: 'bg-green-100 text-green-700',
  ANNULEE: 'bg-red-100 text-red-700',
};

const CHANTIER_STATUT: Record<string, string> = {
  EN_ATTENTE: 'bg-gray-100 text-gray-600',
  EN_COURS: 'bg-blue-100 text-blue-700',
  TERMINE: 'bg-green-100 text-green-700',
  GARANTIE: 'bg-purple-100 text-purple-700',
};

function formatEuros(value: string | number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value));
}

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
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/contacts"
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Retour">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{fullName}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[contact.type]}`}>
              {TYPE_LABELS[contact.type]}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/contacts/${id}/modifier`)}
            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200
                       text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Edit3 size={16} /> Modifier
          </button>
          <button onClick={() => router.push(`/contacts/${id}/modifier`)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200"
            aria-label="Modifier">
            <Edit3 size={20} className="text-gray-600" />
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="p-2 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors"
            aria-label="Supprimer">
            <Trash2 size={20} className="text-red-500" />
          </button>
        </div>
      </div>

      {/* Layout 2 colonnes desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Colonne gauche — infos + actions rapides */}
        <div className="lg:col-span-2 space-y-4">
          {/* Actions rapides — gros boutons tactiles */}
          <div className="grid grid-cols-4 gap-2 lg:gap-3">
            <ActionButton href={`tel:${contact.telephone}`} icon={Phone} label="Appeler"
              color="bg-green-50 text-green-600 active:bg-green-100" />
            <ActionButton href={`sms:${contact.telephone}`} icon={MessageSquare} label="SMS"
              color="bg-blue-50 text-blue-600 active:bg-blue-100" />
            {contact.email && (
              <ActionButton href={`mailto:${contact.email}`} icon={Mail} label="Email"
                color="bg-purple-50 text-purple-600 active:bg-purple-100" />
            )}
            {fullAddress && (
              <ActionButton
                href={`https://maps.apple.com/?q=${encodeURIComponent(fullAddress)}`}
                icon={Navigation} label="GPS" target="_blank"
                color="bg-amber-50 text-amber-600 active:bg-amber-100" />
            )}
          </div>

          {/* Informations */}
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Informations</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Colonne droite — actions et historique */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Actions</h2>
            <div className="space-y-2">
              <Link href={`/devis/nouveau?contactId=${contact.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100
                           transition-colors min-h-[48px]">
                <FileText size={20} className="text-blue-600" />
                <span className="font-medium">Creer un devis</span>
              </Link>
              <Link href={`/factures/nouvelle?contactId=${contact.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100
                           transition-colors min-h-[48px]">
                <Receipt size={20} className="text-green-600" />
                <span className="font-medium">Creer une facture</span>
              </Link>
            </div>
          </div>

          {/* Historique */}
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Historique</h2>
            {contact.devis.length === 0 && contact.factures.length === 0 && contact.chantiers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Aucun devis, facture ou chantier pour ce contact
              </p>
            ) : (
              <div className="space-y-4">
                {/* Chantiers */}
                {contact.chantiers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Chantiers</p>
                    <div className="space-y-1.5">
                      {contact.chantiers.map((ch) => (
                        <Link key={ch.id} href={`/chantiers/${ch.id}`}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <Hammer size={14} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{ch.nom}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CHANTIER_STATUT[ch.statut] || ''}`}>
                            {ch.statut.replace('_', ' ')}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Devis */}
                {contact.devis.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Devis</p>
                    <div className="space-y-1.5">
                      {contact.devis.map((d) => (
                        <Link key={d.id} href={`/devis/${d.id}`}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{d.numero}</p>
                            <p className="text-xs text-gray-400">{d.objet}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">{formatEuros(d.totalTTC)}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${DEVIS_STATUT[d.statut] || ''}`}>
                              {d.statut}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Factures */}
                {contact.factures.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Factures</p>
                    <div className="space-y-1.5">
                      {contact.factures.map((f) => (
                        <Link key={f.id} href={`/factures/${f.id}`}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{f.numero}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">{formatEuros(f.totalTTC)}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${FACTURE_STATUT[f.statut] || ''}`}>
                              {f.statut.replace('_', ' ')}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  href,
  icon: Icon,
  label,
  color,
  target,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  color: string;
  target?: string;
}) {
  return (
    <a
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl
                 transition-colors min-h-[72px] ${color}`}
    >
      <Icon size={24} />
      <span className="text-xs font-medium">{label}</span>
    </a>
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
