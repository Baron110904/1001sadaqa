'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FileText,
  HandCoins,
  Handshake,
  Images,
  Inbox,
  LayoutDashboard,
  Menu,
  Settings,
  X,
} from 'lucide-react';
import type { AdminUser } from '@/lib/admin/session';
import type { ResourceDef } from '@/lib/admin/resources';

const ROLE_LABELS: Record<AdminUser['role'], string> = {
  ADMIN: 'Administration',
  EDITOR: 'Édition',
  CONTRIBUTOR: 'Contribution',
};

/** Compteurs affichés en pastille sur les entrées de navigation. */
export interface ShellBadges {
  requests: number;
  donations: number | null;
}

interface AdminShellProps {
  user: AdminUser;
  resources: ResourceDef[];
  badges: ShellBadges;
  children: React.ReactNode;
  /** Formulaire de déconnexion, monté côté serveur. */
  logoutSlot: React.ReactNode;
}

/** Une entrée simple, ou une section dépliable de plusieurs entrées. */
type Entree = { href: string; label: string; badge?: number | null };

/**
 * Plan de la navigation.
 *
 * Les rubriques de contenu ne sont pas listées une à une : on désigne les
 * `slug` des descripteurs, et seuls ceux réellement ouverts au rôle de la
 * personne connectée sont retenus. Une section qui se vide disparaît, plutôt
 * que d'afficher un dépliant vide.
 */
const PLAN = [
  {
    titre: 'Éditorial',
    sections: [
      {
        cle: 'contenus',
        label: 'Contenus',
        Icon: FileText,
        // Une entrée par famille, pas une par table : les rubriques jumelées
        // — projets et causes, actualités et événements — partagent une ligne
        // et se rejoignent par les onglets de la liste. C'est la disposition
        // de la maquette, et la navigation tient sans défiler.
        slugs: [
          'programmes',
          'projets',
          'actualites',
          'temoignages',
          'equipe',
          'campagnes-saisonnieres',
        ],
      },
      {
        cle: 'banque',
        label: 'Banque alimentaire',
        Icon: Boxes,
        slugs: ['stocks', 'mouvements'],
      },
      {
        cle: 'mediatheque',
        label: 'Médiathèque',
        Icon: Images,
        liens: [{ href: '/admin/medias', label: 'Bibliothèque de médias' }],
        slugs: ['documents'],
      },
    ],
  },
  {
    titre: 'Relations',
    sections: [
      {
        cle: 'demandes',
        label: 'Demandes reçues',
        Icon: Inbox,
        lien: '/admin/demandes',
        badge: 'requests' as const,
      },
      {
        cle: 'dons',
        label: 'Dons',
        Icon: HandCoins,
        lien: '/admin/demandes?onglet=dons',
        badge: 'donations' as const,
        adminSeulement: true,
      },
      {
        cle: 'partenaires',
        label: 'Partenaires',
        Icon: Handshake,
        slugs: ['partenaires', 'missions'],
      },
    ],
  },
  {
    titre: 'Réglages',
    sections: [
      {
        cle: 'parametres',
        label: 'Paramètres',
        Icon: Settings,
        liens: [
          { href: '/admin/parametres', label: 'Réglages du site' },
          { href: '/admin/utilisateurs', label: 'Utilisateurs' },
        ],
        adminSeulement: true,
      },
    ],
  },
] as const;

const CLE_REPLI = 'sadaqa.admin.nav-replie';

export function AdminShell({ user, resources, badges, children, logoutSlot }: AdminShellProps) {
  const pathname = usePathname();
  const [ouvertMobile, setOuvertMobile] = useState(false);
  const [replie, setReplie] = useState(false);

  // Le repli est retenu d'une visite à l'autre : sans cela il se remettrait à
  // zéro au moindre rechargement complet, et le bouton ne servirait à rien.
  useEffect(() => {
    setReplie(window.localStorage.getItem(CLE_REPLI) === '1');
  }, []);

  const basculerRepli = () => {
    setReplie((actuel) => {
      window.localStorage.setItem(CLE_REPLI, actuel ? '0' : '1');
      return !actuel;
    });
  };

  const estAdmin = user.role === 'ADMIN';

  /** Le plan, réduit aux entrées que ce rôle peut réellement ouvrir. */
  const plan = useMemo(() => {
    const parSlug = new Map(resources.map((resource) => [resource.slug, resource]));

    return PLAN.map((groupe) => ({
      titre: groupe.titre,
      sections: groupe.sections
        .filter((section) => !('adminSeulement' in section && section.adminSeulement) || estAdmin)
        .map((section) => {
          const entrees: Entree[] = [
            ...('liens' in section ? section.liens : []),
            ...('slugs' in section
              ? section.slugs
                  .map((slug) => parSlug.get(slug))
                  .filter((resource): resource is ResourceDef => Boolean(resource))
                  .map((resource) => ({
                    href: `/admin/${resource.slug}`,
                    // Une rubrique jumelée annonce les deux noms : « Projets ·
                    // Causes ». Le visiteur sait ainsi où trouver la seconde,
                    // qui n'a pas sa propre ligne.
                    label: [
                      resource.navLabel ?? resource.label,
                      ...(resource.siblings ?? [])
                        .map((voisin) => {
                          const cible = parSlug.get(voisin);
                          return cible?.navLabel ?? cible?.label;
                        })
                        .filter(Boolean),
                    ].join(' · '),
                  }))
              : []),
          ];

          return {
            cle: section.cle,
            label: section.label,
            Icon: section.Icon,
            lien: 'lien' in section ? section.lien : undefined,
            badge:
              'badge' in section
                ? section.badge === 'requests'
                  ? badges.requests
                  : badges.donations
                : undefined,
            entrees,
          };
        })
        .filter((section) => Boolean(section.lien) || section.entrees.length > 0),
    })).filter((groupe) => groupe.sections.length > 0);
  }, [resources, estAdmin, badges]);

  const actif = (href: string) => {
    const chemin = href.split('?')[0];
    return chemin === '/admin' ? pathname === '/admin' : pathname.startsWith(chemin);
  };

  /**
   * Sections ouvertes.
   *
   * Celle qui contient la page courante s'ouvre d'elle-même : arriver sur une
   * fiche sans voir où l'on se trouve dans l'arborescence désorienterait.
   */
  const sectionCourante = plan
    .flatMap((groupe) => groupe.sections)
    .find((section) => section.entrees.some((entree) => actif(entree.href)))?.cle;

  const [ouvertes, setOuvertes] = useState<string[]>(['contenus']);
  useEffect(() => {
    if (sectionCourante) {
      setOuvertes((actuelles) =>
        actuelles.includes(sectionCourante) ? actuelles : [...actuelles, sectionCourante],
      );
    }
  }, [sectionCourante]);

  const basculer = (cle: string) =>
    setOuvertes((actuelles) =>
      actuelles.includes(cle) ? actuelles.filter((c) => c !== cle) : [...actuelles, cle],
    );

  const fermerMobile = () => setOuvertMobile(false);

  /** Entrée menant directement à une page. */
  const LienDirect = ({
    href,
    label,
    Icon,
    badge,
    indent = false,
  }: {
    href: string;
    label: string;
    Icon?: typeof LayoutDashboard;
    badge?: number | null;
    indent?: boolean;
  }) => (
    <Link
      href={href}
      onClick={fermerMobile}
      aria-current={actif(href) ? 'page' : undefined}
      title={replie ? label : undefined}
      className={`flex items-center gap-2.5 rounded-card py-2.5 text-[0.875rem] transition-colors duration-200 ${
        replie ? 'justify-center px-2' : indent ? 'pr-3 pl-10' : 'px-3'
      } ${
        actif(href)
          ? 'bg-ink font-semibold text-paper'
          : 'text-ink/80 hover:bg-mist hover:text-ink'
      }`}
    >
      {Icon && (
        <Icon
          className={`size-4 shrink-0 ${actif(href) ? '' : 'text-leaf'}`}
          aria-hidden
        />
      )}
      {!replie && <span className="flex-1 truncate">{label}</span>}
      {!replie && typeof badge === 'number' && badge > 0 && (
        <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 font-display text-[0.6875rem] font-bold text-ink tabular">
          {badge}
        </span>
      )}
    </Link>
  );

  const nav = (
    <nav aria-label="Navigation du back-office" className="flex h-full flex-col">
      <div className={`flex items-center gap-2.5 py-5 ${replie ? 'justify-center px-2' : 'px-3'}`}>
        <Image
          src="/brand/logo.png"
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0 object-contain"
        />
        {!replie && (
          <span className="flex-1 font-display text-[0.9375rem] font-bold text-ink">
            1001&nbsp;SADAQA
          </span>
        )}

        {/* Le repli n'a pas de sens sur le panneau escamotable du téléphone :
            il s'y ferme déjà en entier. */}
        <button
          type="button"
          onClick={basculerRepli}
          aria-label={replie ? 'Déplier la navigation' : 'Replier la navigation'}
          aria-pressed={replie}
          className="hidden size-8 shrink-0 items-center justify-center rounded-card text-muted transition-colors hover:bg-mist hover:text-ink lg:flex"
        >
          {replie ? (
            <ChevronsRight className="size-4" aria-hidden />
          ) : (
            <ChevronsLeft className="size-4" aria-hidden />
          )}
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto pb-4 ${replie ? 'px-2' : 'px-3'}`}>
        <ul className="space-y-0.5">
          <li>
            <LienDirect href="/admin" label="Tableau de bord" Icon={LayoutDashboard} />
          </li>
        </ul>

        {plan.map((groupe) => (
          <div key={groupe.titre}>
            {replie ? (
              <hr className="my-3 border-ink/10" />
            ) : (
              <p className="eyebrow mt-6 mb-2 px-3 text-muted">{groupe.titre}</p>
            )}

            <ul className="space-y-0.5">
              {groupe.sections.map((section) =>
                section.lien ? (
                  <li key={section.cle}>
                    <LienDirect
                      href={section.lien}
                      label={section.label}
                      Icon={section.Icon}
                      badge={section.badge}
                    />
                  </li>
                ) : (
                  <li key={section.cle}>
                    {/* Replié, la section devient un simple lien vers sa
                        première entrée : un dépliant large ne tient pas dans
                        un rail d'icônes. */}
                    {replie ? (
                      <LienDirect
                        href={section.entrees[0].href}
                        label={section.label}
                        Icon={section.Icon}
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => basculer(section.cle)}
                          aria-expanded={ouvertes.includes(section.cle)}
                          aria-controls={`section-${section.cle}`}
                          className={`flex w-full items-center gap-2.5 rounded-card px-3 py-2.5 text-left text-[0.875rem] transition-colors duration-200 ${
                            section.entrees.some((entree) => actif(entree.href))
                              ? 'bg-mist font-semibold text-ink'
                              : 'text-ink/80 hover:bg-mist hover:text-ink'
                          }`}
                        >
                          <section.Icon className="size-4 shrink-0 text-leaf" aria-hidden />
                          <span className="flex-1 truncate">{section.label}</span>
                          <ChevronDown
                            className={`size-3.5 shrink-0 text-muted transition-transform duration-300 ${
                              ouvertes.includes(section.cle) ? 'rotate-180' : ''
                            }`}
                            aria-hidden
                          />
                        </button>

                        <ul
                          id={`section-${section.cle}`}
                          hidden={!ouvertes.includes(section.cle)}
                          className="mt-0.5 space-y-0.5"
                        >
                          {section.entrees.map((entree) => (
                            <li key={entree.href}>
                              <LienDirect href={entree.href} label={entree.label} indent />
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ink/10 p-3">
        {replie ? (
          <p
            className="mx-auto flex size-9 items-center justify-center rounded-full bg-gold font-display text-[0.75rem] font-bold text-ink"
            title={user.name}
          >
            {initiales(user.name)}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2.5 px-1 pb-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold font-display text-[0.75rem] font-bold text-ink">
                {initiales(user.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[0.8125rem] font-semibold text-ink">
                  {user.name}
                </span>
                <span className="block text-[0.75rem] text-muted">
                  {ROLE_LABELS[user.role]}
                </span>
              </span>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-card px-3 py-2 text-[0.8125rem] text-muted transition-colors hover:bg-mist hover:text-ink"
            >
              <ExternalLink className="size-4" aria-hidden />
              Voir le site
            </a>

            <div className="[&_button]:flex [&_button]:w-full [&_button]:items-center [&_button]:gap-2.5 [&_button]:rounded-card [&_button]:px-3 [&_button]:py-2 [&_button]:text-left [&_button]:text-[0.8125rem] [&_button]:text-muted [&_button]:transition-colors [&_button:hover]:bg-mist [&_button:hover]:text-ink">
              {logoutSlot}
            </div>
          </>
        )}
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-mist">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-ink/10 bg-paper transition-[width] duration-300 lg:block ${
          replie ? 'w-16' : 'w-64'
        }`}
      >
        {nav}
      </aside>

      {/* Bandeau mobile. */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-ink/10 bg-paper px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2">
          <Image
            src="/brand/logo.png"
            alt=""
            width={28}
            height={28}
            className="size-7 object-contain"
          />
          <span className="font-display text-sm font-bold text-ink">Back-office</span>
        </span>
        <button
          type="button"
          onClick={() => setOuvertMobile(true)}
          aria-label="Ouvrir la navigation"
          className="flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-mist active:bg-fog"
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </header>

      {ouvertMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer la navigation"
            onClick={fermerMobile}
            className="absolute inset-0 bg-ink-deep/70"
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-paper">
            <button
              type="button"
              onClick={fermerMobile}
              aria-label="Fermer la navigation"
              className="absolute top-4 right-3 z-10 flex size-9 items-center justify-center rounded-full text-ink hover:bg-mist"
            >
              <X className="size-5" aria-hidden />
            </button>
            {nav}
          </aside>
        </div>
      )}

      <div className={replie ? 'lg:pl-16' : 'lg:pl-64'}>
        <main className="container-page py-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}

/** Deux initiales au plus, pour la pastille de compte. */
function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? '')
    .join('');
}
