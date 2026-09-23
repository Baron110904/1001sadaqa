'use client';

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useState } from 'react';
import { text } from '@/lib/text';
import { EASE_EXPO } from '@/components/motion/motion-config';
import { whatsappLink } from '@/lib/format';

/**
 * Accès direct à WhatsApp Business, exigé par le cahier des charges (§ 5.3).
 *
 * Le bouton n'apparaît qu'après 600 px de défilement : il ne recouvre pas les
 * appels à l'action du héros, et se propose au moment où le visiteur cherche
 * à joindre l'association. Le libellé se déplie au survol sur grand écran,
 * pour rester une simple pastille sur mobile.
 */
export function WhatsAppFab({ phone }: { phone: string }) {
  const t = text('contact');
  const tCommon = text('common');
  const [visible, setVisible] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => setVisible(latest > 600));

  if (!phone) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href={whatsappLink(phone, tCommon('whatsappMessage'))}
          target="_blank"
          rel="noreferrer noopener"
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.9 }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.42, ease: EASE_EXPO }}
          className="group fixed right-4 bottom-4 z-60 flex items-center gap-0 overflow-hidden rounded-full bg-whatsapp py-3.5 pr-3.5 pl-3.5 shadow-lift md:right-6 md:bottom-6"
          aria-label={t('whatsappCta')}
        >
          <svg viewBox="0 0 24 24" className="size-6 shrink-0 fill-ink" aria-hidden>
            <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.13-.42-2.15-1.33-.8-.71-1.34-1.6-1.5-1.9-.15-.3-.01-.46.13-.61.14-.15.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.66-.51h-.56c-.2 0-.5.07-.77.37-.26.3-1 .97-1 2.36s1.02 2.74 1.16 2.94c.15.2 2 3.2 4.87 4.37 2.86 1.17 3.14.97 3.7.92.57-.05 1.85-.75 2.11-1.48.26-.72.26-1.34.18-1.47-.07-.12-.27-.2-.57-.35Z" />
            <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.86.52 3.6 1.42 5.09L2 22l5.2-1.58a9.78 9.78 0 0 0 4.84 1.28c5.43 0 9.84-4.4 9.84-9.84S17.47 2 12.04 2Zm0 17.96c-1.58 0-3.05-.46-4.29-1.26l-.3-.19-3.08.93.93-3.02-.2-.32a7.94 7.94 0 0 1-1.24-4.26c0-4.42 3.6-8.02 8.02-8.02s8.02 3.6 8.02 8.02-3.6 8.12-7.86 8.12Z" />
          </svg>

          <span className="max-w-0 overflow-hidden font-display text-sm font-semibold whitespace-nowrap text-ink transition-all duration-500 ease-out group-hover:max-w-48 group-hover:pl-2.5 group-focus-visible:max-w-48 group-focus-visible:pl-2.5">
            {t('whatsappCta')}
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
