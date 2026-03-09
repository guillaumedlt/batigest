'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User, X, Save } from 'lucide-react';

type Evenement = {
  id: string;
  titre: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  journeeEntiere: boolean;
  adresse: string | null;
  notes: string | null;
  rappel: number | null;
  couleur: string | null;
  contact: {
    id: string;
    nom: string;
    prenom: string | null;
    entreprise: string | null;
    telephone: string | null;
  } | null;
};

type ContactOption = {
  id: string;
  nom: string;
  prenom: string | null;
  entreprise: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  CHANTIER: 'Chantier',
  RDV_CLIENT: 'RDV Client',
  RDV_FOURNISSEUR: 'RDV Fournisseur',
  RELANCE: 'Relance',
  PERSO: 'Personnel',
};

const TYPE_COLORS: Record<string, string> = {
  CHANTIER: 'bg-orange-500',
  RDV_CLIENT: 'bg-blue-500',
  RDV_FOURNISSEUR: 'bg-purple-500',
  RELANCE: 'bg-red-500',
  PERSO: 'bg-gray-500',
};

const TYPE_BG: Record<string, string> = {
  CHANTIER: 'bg-orange-50 text-orange-700 border-orange-200',
  RDV_CLIENT: 'bg-blue-50 text-blue-700 border-blue-200',
  RDV_FOURNISSEUR: 'bg-purple-50 text-purple-700 border-purple-200',
  RELANCE: 'bg-red-50 text-red-700 border-red-200',
  PERSO: 'bg-gray-50 text-gray-700 border-gray-200',
};

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Lundi = 0, Dimanche = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Jours du mois precedent
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Jours du mois courant
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }

  // Jours du mois suivant pour completer la grille
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
  }

  return days;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function formatDateInput(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatTimeInput(date: Date) {
  return date.toTimeString().slice(0, 5);
}

const emptyForm = {
  titre: '',
  type: 'CHANTIER',
  dateDebut: '',
  heureDebut: '08:00',
  dateFin: '',
  heureFin: '09:00',
  journeeEntiere: false,
  contactId: '',
  contactLabel: '',
  adresse: '',
  notes: '',
};

export default function CalendrierPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Evenement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  const days = getMonthDays(currentYear, currentMonth);

  const loadEvents = useCallback(() => {
    const debut = days[0].date.toISOString();
    const fin = days[days.length - 1].date.toISOString();
    fetch(`/api/evenements?debut=${encodeURIComponent(debut)}&fin=${encodeURIComponent(fin)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEvenements(data);
      });
  }, [currentYear, currentMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (contactSearch.length >= 2) {
      fetch(`/api/contacts?search=${encodeURIComponent(contactSearch)}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setContacts(data);
            setShowContactDropdown(true);
          }
        });
    } else {
      setShowContactDropdown(false);
    }
  }, [contactSearch]);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  function goToday() {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }

  function getEventsForDay(date: Date) {
    return evenements.filter((e) => {
      const start = new Date(e.dateDebut);
      const end = new Date(e.dateFin);
      return date >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
        date <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
    });
  }

  function openCreateModal(date?: Date) {
    const d = date || today;
    setEditingId(null);
    setForm({
      ...emptyForm,
      dateDebut: formatDateInput(d),
      dateFin: formatDateInput(d),
    });
    setContactSearch('');
    setShowModal(true);
  }

  function openEditModal(event: Evenement) {
    const start = new Date(event.dateDebut);
    const end = new Date(event.dateFin);
    setEditingId(event.id);
    setForm({
      titre: event.titre,
      type: event.type,
      dateDebut: formatDateInput(start),
      heureDebut: formatTimeInput(start),
      dateFin: formatDateInput(end),
      heureFin: formatTimeInput(end),
      journeeEntiere: event.journeeEntiere,
      contactId: event.contact?.id || '',
      contactLabel: event.contact
        ? (event.contact.entreprise || `${event.contact.nom} ${event.contact.prenom || ''}`.trim())
        : '',
      adresse: event.adresse || '',
      notes: event.notes || '',
    });
    setContactSearch('');
    setSelectedEvent(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const dateDebut = form.journeeEntiere
      ? `${form.dateDebut}T00:00:00`
      : `${form.dateDebut}T${form.heureDebut}:00`;
    const dateFin = form.journeeEntiere
      ? `${form.dateFin || form.dateDebut}T23:59:59`
      : `${form.dateFin || form.dateDebut}T${form.heureFin}:00`;

    const payload = {
      titre: form.titre,
      type: form.type,
      dateDebut,
      dateFin,
      journeeEntiere: form.journeeEntiere,
      contactId: form.contactId || null,
      adresse: form.adresse || null,
      notes: form.notes || null,
    };

    const url = editingId ? `/api/evenements/${editingId}` : '/api/evenements';
    const method = editingId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowModal(false);
      loadEvents();
    } else {
      const err = await res.json();
      alert(err.error || 'Erreur lors de l\'enregistrement.');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet evenement ?')) return;
    const res = await fetch(`/api/evenements/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSelectedEvent(null);
      loadEvents();
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
          <p className="text-sm text-gray-500 mt-0.5">Planifiez vos chantiers et rendez-vous</p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl
                     font-semibold text-sm active:scale-95 transition-transform"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouvel evenement</span>
        </button>
      </div>

      {/* Month navigation */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">
              {MOIS[currentMonth]} {currentYear}
            </h2>
            <button onClick={goToday} className="text-xs text-blue-600 hover:underline">
              Aujourd&apos;hui
            </button>
          </div>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden">
          {/* Day headers */}
          {JOURS.map((j) => (
            <div key={j} className="bg-gray-50 text-center py-2 text-xs font-semibold text-gray-500 uppercase">
              {j}
            </div>
          ))}

          {/* Day cells */}
          {days.map((day, i) => {
            const dayEvents = getEventsForDay(day.date);
            const isToday = isSameDay(day.date, today);
            const isSelected = selectedDate && isSameDay(day.date, selectedDate);

            return (
              <div
                key={i}
                onClick={() => {
                  setSelectedDate(day.date);
                  setSelectedEvent(null);
                }}
                onDoubleClick={() => openCreateModal(day.date)}
                className={`bg-white min-h-[80px] sm:min-h-[100px] p-1 cursor-pointer transition-colors
                           hover:bg-blue-50/50
                           ${!day.isCurrentMonth ? 'opacity-40' : ''}
                           ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              >
                <div className={`text-sm font-medium mb-0.5 w-7 h-7 flex items-center justify-center rounded-full
                                ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(ev);
                        setSelectedDate(new Date(ev.dateDebut));
                      }}
                      className={`w-full text-left text-[10px] sm:text-xs px-1.5 py-0.5 rounded truncate
                                 ${TYPE_BG[ev.type] || 'bg-gray-50 text-gray-700'} border`}
                    >
                      {!ev.journeeEntiere && (
                        <span className="font-medium">{formatTime(ev.dateDebut)} </span>
                      )}
                      {ev.titre}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-[10px] text-gray-400 px-1">+{dayEvents.length - 3} autres</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Type legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className={`w-2.5 h-2.5 rounded-full ${TYPE_COLORS[key]}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Selected day events panel */}
      {selectedDate && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <button
              onClick={() => openCreateModal(selectedDate)}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              + Ajouter
            </button>
          </div>

          {getEventsForDay(selectedDate).length === 0 ? (
            <p className="text-sm text-gray-400">Aucun evenement ce jour</p>
          ) : (
            <div className="space-y-3">
              {getEventsForDay(selectedDate).map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all
                             ${selectedEvent?.id === ev.id ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-1 h-full min-h-[40px] rounded-full ${TYPE_COLORS[ev.type]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_BG[ev.type]}`}>
                          {TYPE_LABELS[ev.type]}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 mt-1">{ev.titre}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {ev.journeeEntiere
                            ? 'Journee entiere'
                            : `${formatTime(ev.dateDebut)} - ${formatTime(ev.dateFin)}`}
                        </span>
                        {ev.adresse && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin size={12} />
                            {ev.adresse}
                          </span>
                        )}
                      </div>
                      {ev.contact && (
                        <p className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <User size={12} />
                          {ev.contact.entreprise || `${ev.contact.nom} ${ev.contact.prenom || ''}`}
                        </p>
                      )}
                      {ev.notes && selectedEvent?.id === ev.id && (
                        <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{ev.notes}</p>
                      )}
                      {selectedEvent?.id === ev.id && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(ev); }}
                            className="text-sm text-blue-600 font-medium hover:underline"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(ev.id); }}
                            className="text-sm text-red-600 font-medium hover:underline"
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Modifier l\'evenement' : 'Nouvel evenement'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  required
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  placeholder="Ex: Chantier renovation salle de bain"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...form, type: key })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all
                                 ${form.type === key
                                   ? `${TYPE_BG[key]} border-current ring-1 ring-current`
                                   : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${TYPE_COLORS[key]}`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.journeeEntiere}
                    onChange={(e) => setForm({ ...form, journeeEntiere: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full
                                  peer peer-checked:after:translate-x-full peer-checked:bg-blue-600
                                  after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                  after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
                <span className="text-sm font-medium text-gray-700">Journee entiere</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date debut *</label>
                  <input
                    type="date"
                    required
                    value={form.dateDebut}
                    onChange={(e) => setForm({ ...form, dateDebut: e.target.value, dateFin: form.dateFin || e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {!form.journeeEntiere && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure debut</label>
                    <input
                      type="time"
                      value={form.heureDebut}
                      onChange={(e) => setForm({ ...form, heureDebut: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                  <input
                    type="date"
                    value={form.dateFin}
                    onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {!form.journeeEntiere && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label>
                    <input
                      type="time"
                      value={form.heureFin}
                      onChange={(e) => setForm({ ...form, heureFin: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact associe</label>
                <input
                  type="text"
                  value={form.contactId ? form.contactLabel : contactSearch}
                  onChange={(e) => {
                    if (form.contactId) {
                      setForm({ ...form, contactId: '', contactLabel: '' });
                    }
                    setContactSearch(e.target.value);
                  }}
                  placeholder="Rechercher un contact..."
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {form.contactId && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, contactId: '', contactLabel: '' });
                      setContactSearch('');
                    }}
                    className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 text-sm"
                  >
                    Changer
                  </button>
                )}
                {showContactDropdown && contacts.length > 0 && !form.contactId && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {contacts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          const label = c.entreprise || `${c.nom} ${c.prenom || ''}`.trim();
                          setForm({ ...form, contactId: c.id, contactLabel: label });
                          setShowContactDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm"
                      >
                        <p className="font-medium text-gray-900">{c.entreprise || `${c.nom} ${c.prenom || ''}`}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse / Lieu</label>
                <input
                  type="text"
                  value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  placeholder="Ex: 12 rue des Lilas, 75020 Paris"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-base
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !form.titre || !form.dateDebut}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white
                           px-6 py-4 rounded-xl font-semibold text-base
                           active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none"
              >
                <Save size={20} />
                {saving ? 'Enregistrement...' : (editingId ? 'Modifier' : 'Creer l\'evenement')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
