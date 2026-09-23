'use client';

import { AnimatePresence, motion } from 'motion/react';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { EASE_EXPO } from '@/components/motion/motion-config';

interface FormStatusProps {
  state: 'idle' | 'success' | 'error';
  message?: string;
}

/**
 * Retour d'un formulaire. `role="status"` pour un succès, `role="alert"` pour
 * une erreur : un lecteur d'écran annonce l'erreur immédiatement, le succès
 * sans interrompre la saisie en cours.
 */
export function FormStatus({ state, message }: FormStatusProps) {
  const success = state === 'success';

  return (
    <AnimatePresence>
      {state !== 'idle' && message && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.4, ease: EASE_EXPO }}
          className="overflow-hidden"
        >
          <div
            role={success ? 'status' : 'alert'}
            className={`flex items-start gap-3 rounded-card border px-4 py-3.5 text-[0.9375rem] ${
              success
                ? 'border-leaf/30 bg-leaf/8 text-ink'
                : 'border-red-600/30 bg-red-50 text-red-900'
            }`}
          >
            {success ? (
              <CircleCheck className="mt-0.5 size-5 shrink-0 text-leaf" aria-hidden />
            ) : (
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-700" aria-hidden />
            )}
            <p>{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
