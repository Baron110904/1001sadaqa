'use client';

import Image from 'next/image';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { Menu, Moon, Phone, Sparkle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { text } from '@/lib/text';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ActionLink } from '@/components/ui/Button';
import { EASE_EXPO } from '@/components/motion/motion-config';
import type { SeasonalCampaign } from '@/lib/types';

/**
 * Sept entrées, pas davantage (§2.1).
 *
 * Deux d'entre elles ouvrent un sous-menu au survol sur grand écran : les
 * quatre domaines pour les programmes, les quatre parcours pour la communauté.
 * Sur téléphone, les sous-entrées se déplient dans le menu, sans second
 * niveau d'accordéon.
 */
const LINKS = [
  { href: '/programmes', key: 'programs', children: 'domains' },
  { href: '/projets', key: 'projects' },
  { href: '/actualites', key: 'news' },
  { href: '/communaute', key: 'community', children: 'community' },
  { href: '/a-propos', key: 'about' },
  { href: '/contact', key: 'contact' },
] as const;

/** Parcours d'engagement, repris dans le sous-menu Communauté. */
const COMMUNITY_LINKS = [
  { href: '/communaute/membre', key: 'communityMember' },
  { href: '/communaute/benevole', key: 'communityVolunteer' },
  { href: '/communaute/partenaire', key: 'communityPartner' },
  { href: '/communaute/donateur', key: 'communityDonor' },
  { href: '/espace', key: 'space' },
] as const;

/**
 * Bandeau de navigation.
 *
 * Il reste fixe en haut, et se resserre au-delà de 40 px de défilement : la
 * hauteur diminue et une bordure apparaît, ce qui décolle visuellement le
 * bandeau du contenu sans changer sa couleur.
 */
export function SiteHeader({
  phone,
  campaign,
}: {
  phone: string;
  campaign: SeasonalCampaign | null;
}) {
  const t = text('nav');
  const tHeader = text('header');
  const pathname = usePathname();
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => setCondensed(y > 40));

  // Une fois au montage : une page ouverte déjà défilée — ancre, position
  // restaurée par le navigateur — n'attend pas le premier geste pour prendre
  // sa forme resserrée.
  useEffect(() => setCondensed(window.scrollY > 40), []);

  // Un changement de page ferme le panneau mobile.
  useEffect(() => setOpen(false), [pathname]);

  // Panneau ouvert : on bloque le défilement de la page derrière.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-80 focus:rounded-full focus:bg-gold focus:px-5 focus:py-2.5 focus:font-display focus:text-sm focus:font-semibold focus:text-ink"
      >
        {t('skipToContent')}
      </a>

      {/*
        `sticky` et non `fixed`.

        Fixé, l'en-tête sortait du flux et le contenu devait compenser sa
        hauteur à la main. Dès qu'un bandeau de campagne s'ajoutait au-dessus,
        la compensation devenait fausse et une bande claire apparaissait sous
        l'en-tête. Collant, il occupe sa place : plus rien à compenser, quel
        que soit ce qui le précède.
      */}
      <header
        className={`sticky top-0 z-60 border-b transition-all duration-500 ${
          condensed
            ? 'border-paper/12 bg-ink/92 backdrop-blur-xl'
            : 'border-transparent bg-ink'
        }`}
      >
        <div
          className={`container-page flex items-center justify-between gap-6 transition-all duration-500 ${
            condensed ? 'h-16' : 'h-20'
          }`}
        >
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="1001 SADAQA">
            <Image
              src="/brand/logo.png"
              alt=""
              width={40}
              height={40}
              priority
              className="size-9 object-contain transition-transform duration-500 ease-out group-hover:scale-110"
            />
            <span className="font-display text-[1.0625rem] font-bold tracking-tight text-paper">
              1001&nbsp;SADAQA
            </span>
          </Link>

          <nav aria-label="Navigation principale" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {LINKS.map((link) => (
                <li key={link.href} className="group relative">
                  <Link
                    href={link.href}
                    data-active={isActive(link.href)}
                    className="link-sweep py-1 text-[0.9375rem] text-paper/80 transition-colors duration-200 hover:text-paper data-[active=true]:text-paper"
                  >
                    {t(link.key)}
                  </Link>

                  {'children' in link && link.children === 'community' && (
                    <ul className="invisible absolute top-full left-0 z-50 mt-3 w-56 rounded-card border border-paper/12 bg-ink p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      {COMMUNITY_LINKS.map((parcours) => (
                        <li key={parcours.href}>
                          <Link
                            href={parcours.href}
                            className="block rounded-card px-3 py-2 text-[0.875rem] text-paper/75 transition-colors hover:bg-paper/8 hover:text-paper"
                          >
                            {t(parcours.key)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            {/* Pastille de campagne : présente sur toutes les pages, elle rend
                la fête visible sans imposer un second bandeau. Elle mène au
                héros de l'accueil, où l'offre est détaillée. */}
            {campaign?.pillLabel && (
              <Link
                href="/"
                className="hidden items-center gap-2 rounded-full border border-gold/45 px-4 py-2 font-display text-[0.8125rem] font-semibold text-gold transition-colors hover:border-gold hover:bg-gold/10 md:inline-flex"
              >
                {campaign.theme === 'RAMADAN' ? (
                  <Moon className="size-3.5" strokeWidth={2.5} aria-hidden />
                ) : (
                  <Sparkle className="size-3.5" strokeWidth={2.5} aria-hidden />
                )}
                {campaign.pillLabel}
              </Link>
            )}

            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="group hidden items-center gap-2.5 xl:flex"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-gold/15 text-gold transition-colors duration-200 group-hover:bg-gold group-hover:text-ink">
                <Phone className="size-3.5" strokeWidth={2.5} aria-hidden />
              </span>
              <span className="leading-tight">
                <span className="block text-[0.6875rem] text-paper/55">{tHeader('needHelp')}</span>
                <span className="block font-display text-[0.8125rem] font-bold text-gold">
                  {phone}
                </span>
              </span>
            </a>

            {/* Le masquage porte sur l'enveloppe, pas sur le bouton.
                `ActionLink` applique la classe reçue à sa surface intérieure,
                déjà en `inline-flex` : un `hidden` y arrivait sans effet, et
                le bouton restait affiché sous 640 px. Il poussait alors la
                commande du menu hors de l'écran — 29 px perdus à 320 px, sur
                toutes les pages du site. */}
            <span className="hidden sm:inline-flex">
              <ActionLink href="/communaute/donateur" size="sm" withArrow={false}>
                {tHeader('donate')}
              </ActionLink>
            </span>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t('menu')}
              className="flex size-10 items-center justify-center rounded-full text-paper transition-colors duration-200 hover:bg-paper/10 active:bg-paper/20 lg:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </div>

      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="fixed inset-0 z-70 lg:hidden"
          >
            <div className="bg-ink-gradient grain absolute inset-0" />

            <div className="relative flex h-full flex-col">
              <div className="container-page flex h-20 items-center justify-between">
                <span className="font-display text-[1.0625rem] font-bold text-paper">
                  1001&nbsp;SADAQA
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t('close')}
                  className="flex size-10 items-center justify-center rounded-full text-paper transition-colors duration-200 hover:bg-paper/10 active:bg-paper/20"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              <nav
                aria-label="Navigation principale"
                className="container-page flex-1 overflow-y-auto pt-4 pb-10"
              >
                <ul className="flex flex-col">
                  {LINKS.map((link, index) => (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 + index * 0.045, duration: 0.5, ease: EASE_EXPO }}
                      className="border-b border-paper/10"
                    >
                      <Link
                        href={link.href}
                        className="flex items-center justify-between py-4 font-display text-2xl font-semibold tracking-tight text-paper active:text-gold"
                      >
                        {t(link.key)}
                        <span className="font-sans text-xs text-paper/35 tabular">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </Link>

                      {'children' in link && link.children === 'community' && (
                        <ul className="mb-3 flex flex-col gap-0.5 pl-1">
                          {COMMUNITY_LINKS.map((parcours) => (
                            <li key={parcours.href}>
                              <Link
                                href={parcours.href}
                                className="block py-2 text-[0.9375rem] text-paper/65 active:text-gold"
                              >
                                {t(parcours.key)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.li>
                  ))}
                </ul>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42, duration: 0.5, ease: EASE_EXPO }}
                  className="mt-8 flex flex-col gap-4"
                >
                  <ActionLink href="/communaute/donateur" size="lg" className="w-full">
                    {tHeader('donate')}
                  </ActionLink>

                  <a
                    href={`tel:${phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-2 text-sm text-paper/75"
                  >
                    <Phone className="size-4 text-gold" aria-hidden />
                    {phone}
                  </a>
                </motion.div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
