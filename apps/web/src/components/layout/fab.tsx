'use client';

import { useState } from 'react';
import { Plus, X, FileText, Receipt, Users, Camera } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const actions = [
  { href: '/devis/nouveau', label: 'Nouveau devis', icon: FileText, color: 'bg-blue-500' },
  { href: '/factures/nouvelle', label: 'Nouvelle facture', icon: Receipt, color: 'bg-green-500' },
  { href: '/contacts/nouveau', label: 'Nouveau contact', icon: Users, color: 'bg-purple-500' },
  { href: '/frais/nouveau', label: 'Scanner un frais', icon: Camera, color: 'bg-amber-500' },
];

export default function FAB() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden fixed bottom-20 right-4 z-50 pb-[env(safe-area-inset-bottom)]">
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Actions */}
            <div className="absolute bottom-16 right-0 z-50 flex flex-col gap-3 items-end">
              {actions.map((action, i) => (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={action.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-lg
                               active:scale-95 transition-transform"
                  >
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      {action.label}
                    </span>
                    <div className={`${action.color} text-white rounded-full p-2`}>
                      <action.icon size={20} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Bouton FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center
                   transition-all duration-200 active:scale-90 z-50 relative
                   ${open ? 'bg-gray-700 rotate-45' : 'bg-blue-600'}`}
      >
        {open ? (
          <X size={24} className="text-white -rotate-45" />
        ) : (
          <Plus size={28} className="text-white" />
        )}
      </button>
    </div>
  );
}
