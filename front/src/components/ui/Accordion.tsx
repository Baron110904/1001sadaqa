'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { EASE_EXPO } from '@/components/motion/motion-config';

export interface AccordionItem {
  id: string;
  title: string;
  body: string;
}

/**
 * Accordéon du bloc « Ce que nous faisons ».
 *
 * Un seul volet ouvert à la fois, le premier par défaut. Le signe « + »
 * pivote vers « × » à l'ouverture. Les en-têtes sont de vrais boutons, reliés
 * à leur panneau par aria-controls, donc utilisables au clavier.
 */
export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const baseId = useId();

  return (
    <div className="divide-y divide-ink/10 overflow-hidden rounded-card border border-ink/10 bg-paper">
      {items.map((item) => {
        const open = openId === item.id;
        const panelId = `${baseId}-${item.id}`;

        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors duration-200 hover:bg-mist md:px-6"
              >
                <span className="font-display text-[1.0625rem] font-semibold tracking-tight text-ink">
                  {item.title}
                </span>
                <motion.span
                  animate={{ rotate: open ? 135 : 0 }}
                  transition={{ duration: 0.42, ease: EASE_EXPO }}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold"
                >
                  <Plus className="size-4" strokeWidth={2.5} aria-hidden />
                </motion.span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={panelId}
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.44, ease: EASE_EXPO }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-[0.9375rem] leading-relaxed text-muted md:px-6">
                    {item.body}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
