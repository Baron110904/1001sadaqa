import Link from 'next/link';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { getFoodbank, getFoodbankComments } from '@/lib/api';
import type { FoodCategoryState, StockLevel, StockMovementRow } from '@/lib/types';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { FoodbankCommentForm } from '@/components/forms/FoodbankCommentForm';
import { formatNumber } from '@/lib/format';

/**
 * Banque alimentaire : ce que l'entrepôt contient, et ce qui lui manque.
 *
 * La page ne demande pas « faites un don » dans l'abstrait : elle dit quoi
 * apporter. Les besoins ne sont pas une liste tenue à la main mais les
 * catégories passées sous leur seuil — elles disparaissent donc d'elles-mêmes
 * une fois renflouées, et la page ne peut pas réclamer ce qu'elle a déjà.
 */

const NIVEAUX: Record<StockLevel, { label: string; puce: string; barre: string; carte: string }> = {
  CRITIQUE: {
    label: 'Critique',
    puce: 'bg-red-600 text-white',
    barre: 'bg-red-600',
    carte: 'border-red-200 bg-red-50/70',
  },
  BAS: {
    label: 'Bas',
    puce: 'bg-gold/25 text-gold-deep',
    barre: 'bg-gold',
    carte: 'border-gold/35 bg-gold/8',
  },
  OK: {
    label: 'Suffisant',
    puce: 'bg-leaf/12 text-leaf',
    barre: 'bg-leaf',
    carte: 'border-ink/10 bg-paper',
  },
};

/** Part remplie d'une jauge, bornée : un stock au-delà de la cible reste à 100 %. */
function part(categorie: FoodCategoryState): number {
  if (categorie.target <= 0) return 100;
  return Math.max(2, Math.min(100, Math.round((categorie.quantity / categorie.target) * 100)));
}

function quandDit(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return `il y a ${Math.max(1, minutes)} minute${minutes > 1 ? 's' : ''}`;
  const heures = Math.round(minutes / 60);
  if (heures < 24) return `il y a ${heures} heure${heures > 1 ? 's' : ''}`;
  const jours = Math.round(heures / 24);
  return `il y a ${jours} jour${jours > 1 ? 's' : ''}`;
}

/** Date courte d'un mouvement : « aujourd'hui 14:50 », « hier 09:40 ». */
function quandPrecis(iso: string): string {
  const date = new Date(iso);
  const heure = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const jour = new Date(date);
  jour.setHours(0, 0, 0, 0);
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  const ecart = Math.round((aujourdhui.getTime() - jour.getTime()) / 86_400_000);
  if (ecart === 0) return `aujourd’hui ${heure}`;
  if (ecart === 1) return `hier ${heure}`;
  return `${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${heure}`;
}

function CarteBesoin({ categorie, vedette }: { categorie: FoodCategoryState; vedette: boolean }) {
  const niveau = NIVEAUX[categorie.level];

  return (
    <article
      className={`flex h-full flex-col rounded-panel border p-6 ${
        vedette ? 'border-transparent bg-ink text-paper' : `${niveau.carte} text-ink`
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <h3
          className={`font-display text-[1.0625rem] font-bold tracking-tight ${
            vedette ? 'text-paper' : 'text-ink'
          }`}
        >
          {categorie.name}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-display text-[0.6875rem] font-bold tracking-wide uppercase ${niveau.puce}`}
        >
          {niveau.label}
        </span>
      </div>

      <p className="mt-4 flex items-baseline gap-2">
        <span
          className={`font-display text-4xl leading-none font-bold tracking-tight tabular ${
            vedette ? 'text-gold' : 'text-ink'
          }`}
        >
          {formatNumber(categorie.quantity)}
        </span>
        <span className={`text-[0.875rem] ${vedette ? 'text-paper/70' : 'text-muted'}`}>
          {categorie.unit} sur {formatNumber(categorie.target)}
        </span>
      </p>

      <div
        className={`mt-4 h-2 overflow-hidden rounded-full ${vedette ? 'bg-paper/15' : 'bg-ink/8'}`}
        role="progressbar"
        aria-valuenow={part(categorie)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${categorie.name} : ${categorie.quantity} ${categorie.unit} sur ${categorie.target}`}
      >
        <div className={`h-full rounded-full ${niveau.barre}`} style={{ width: `${part(categorie)}%` }} />
      </div>

      {categorie.examples && (
        <p className={`mt-4 flex-1 text-[0.875rem] ${vedette ? 'text-paper/70' : 'text-muted'}`}>
          {categorie.examples}
        </p>
      )}

      <Link
        href="/banque-alimentaire/apporter"
        className={`mt-5 inline-flex w-fit items-center rounded-full px-5 py-3 font-display text-[0.875rem] font-semibold transition-colors ${
          vedette
            ? 'bg-gold text-ink hover:bg-gold-deep'
            : 'border border-ink/20 text-ink hover:border-ink/45 hover:bg-mist'
        }`}
      >
        Apporter cet article
      </Link>
    </article>
  );
}

function Mouvement({ mouvement }: { mouvement: StockMovementRow }) {
  const entree = mouvement.direction === 'ENTREE';
  const Icone = entree ? ArrowDown : ArrowUp;

  return (
    <div className="flex h-full items-start gap-3.5 rounded-card border border-ink/10 bg-paper p-4">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-card ${
          entree ? 'bg-leaf/12 text-leaf' : 'bg-gold/20 text-gold-deep'
        }`}
      >
        <Icone className="size-4" strokeWidth={2.5} aria-hidden />
        <span className="sr-only">{entree ? 'Entrée' : 'Sortie'}</span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[0.9375rem] font-semibold text-ink">
          {mouvement.counterpart}
        </span>
        <span className="mt-0.5 block text-[0.8125rem] text-muted">
          {mouvement.detail ??
            `${formatNumber(mouvement.quantity)} ${mouvement.category.unit} · ${mouvement.category.name}`}
          {' · '}
          {quandPrecis(mouvement.occurredAt)}
        </span>
      </span>
    </div>
  );
}

export default async function FoodbankPage() {
  const [banque, mots] = await Promise.all([getFoodbank(), getFoodbankComments()]);

  const maximum = Math.max(1, ...banque.flow.monthly.flatMap((m) => [m.in, m.out]));
  const dernier = banque.flow.monthly.length - 1;

  return (
    <>
      {/* ── Ce qui manque ─────────────────────────────────────────────── */}
      <section id="besoins" className="container-page scroll-mt-24 py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          <div>
            {banque.updatedAt && (
              <Reveal from="none">
                <p className="flex items-center gap-2.5 font-display text-[0.75rem] font-bold tracking-[0.16em] text-red-600 uppercase">
                  <span className="size-2 rounded-full bg-red-600" aria-hidden />
                  Mis à jour {quandDit(banque.updatedAt)}
                </p>
              </Reveal>
            )}

            <Reveal delay={0.08}>
              <h1 className="text-title mt-4 font-display font-bold text-ink">
                {banque.needs.length > 0
                  ? 'Voici ce dont l’entrepôt manque aujourd’hui.'
                  : 'L’entrepôt est au complet aujourd’hui.'}
              </h1>
            </Reveal>
          </div>

          <Reveal delay={0.16} className="lg:pt-10">
            <p className="text-base leading-relaxed text-muted">
              Les niveaux sont publiés en direct. Quand une catégorie passe sous son seuil,
              elle apparaît ici - vous savez exactement quoi apporter.
            </p>
          </Reveal>
        </div>

        {banque.needs.length > 0 && (
          <RevealGroup className="mt-10 grid gap-4 lg:grid-cols-3" stagger={0.09}>
            {banque.needs.slice(0, 3).map((categorie, index) => (
              <RevealItem key={categorie.id}>
                <CarteBesoin categorie={categorie} vedette={index === 0} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>

      {/* ── L'état complet du stock ───────────────────────────────────── */}
      <section id="stock" className="container-page scroll-mt-24 pb-14 md:pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-5">
          <h2 className="text-title font-display font-bold text-ink">L’état complet du stock</h2>
          {/* Pas de total toutes catégories confondues : additionner des kg,
              des litres et des unités donnerait un nombre qui ne veut rien
              dire. On compte ce qui se compte - les catégories, et celles qui
              demandent une attention. */}
          <p className="text-[0.875rem] text-muted">
            {banque.categories.length} catégories suivies
            {banque.needs.length > 0 && ` · ${banque.needs.length} sous leur seuil`}
          </p>
        </div>

        <RevealGroup
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          stagger={0.04}
          as="ul"
        >
          {banque.categories.map((categorie) => {
            const niveau = NIVEAUX[categorie.level];
            return (
              <RevealItem key={categorie.id} as="li">
                <div className={`h-full rounded-card border p-4 ${niveau.carte}`}>
                  <p className="text-[0.8125rem] font-medium text-ink">{categorie.name}</p>
                  <p className="mt-2 font-display text-[1.375rem] leading-none font-bold tracking-tight text-ink tabular">
                    {formatNumber(categorie.quantity)}{' '}
                    <span className="text-[0.875rem] font-semibold">{categorie.unit}</span>
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/8">
                    <div
                      className={`h-full rounded-full ${niveau.barre}`}
                      style={{ width: `${part(categorie)}%` }}
                    />
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </section>

      {/* ── Le flux du mois ───────────────────────────────────────────── */}
      <section className="bg-ink py-14 md:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div>
            <h2 className="text-title font-display font-bold text-paper">Le flux du mois</h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-paper/70">
              Ce qui est entré, ce qui a été distribué. L’écart alimente la réserve pour les
              périodes creuses.
            </p>

            <dl className="mt-8 grid grid-cols-3 gap-4">
              {[
                { valeur: banque.flow.totalIn, libelle: 'unités entrées', accent: true },
                { valeur: banque.flow.totalOut, libelle: 'unités distribuées', accent: false },
                { valeur: banque.flow.peopleServed, libelle: 'personnes servies', accent: false },
              ].map((chiffre) => (
                <div key={chiffre.libelle}>
                  <dd
                    className={`font-display text-[1.75rem] leading-none font-bold tracking-tight tabular ${
                      chiffre.accent ? 'text-gold' : 'text-paper'
                    }`}
                  >
                    {formatNumber(Math.round(chiffre.valeur))}
                  </dd>
                  <dt className="mt-1.5 text-[0.75rem] text-paper/60">{chiffre.libelle}</dt>
                </div>
              ))}
            </dl>
          </div>

          {/* Deux barres par mois : entrées et sorties côte à côte. Le mois
              courant est doré, comme le tableau de bord du back-office. */}
          <figure className="min-w-0">
            <div className="flex h-56 items-end gap-3 sm:gap-5" aria-hidden>
              {banque.flow.monthly.map((mois, index) => (
                <div key={mois.month} className="flex h-full flex-1 items-end gap-1">
                  {(['in', 'out'] as const).map((sens) => (
                    <span
                      key={sens}
                      className={`block flex-1 rounded-t-md ${
                        index === dernier
                          ? sens === 'in'
                            ? 'bg-gold'
                            : 'bg-paper/35'
                          : sens === 'in'
                            ? 'bg-leaf/45'
                            : 'bg-gold/45'
                      }`}
                      style={{ height: `${Math.max(2, Math.round((mois[sens] / maximum) * 100))}%` }}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-3 border-t border-paper/15 pt-3 sm:gap-5" aria-hidden>
              {banque.flow.monthly.map((mois, index) => (
                <p
                  key={mois.month}
                  className={`flex-1 text-center text-[0.75rem] ${
                    index === dernier ? 'font-bold text-paper' : 'text-paper/50'
                  }`}
                >
                  {new Date(`${mois.month}-01T00:00:00Z`).toLocaleDateString('fr-FR', {
                    month: 'short',
                    timeZone: 'UTC',
                  })}
                </p>
              ))}
            </div>

            {/* La forme des barres ne dit rien à un lecteur d'écran : le
                tableau porte les mêmes chiffres. */}
            <figcaption className="sr-only">
              <table>
                <caption>Entrées et sorties des six derniers mois</caption>
                <thead>
                  <tr>
                    <th scope="col">Mois</th>
                    <th scope="col">Entrées</th>
                    <th scope="col">Sorties</th>
                  </tr>
                </thead>
                <tbody>
                  {banque.flow.monthly.map((mois) => (
                    <tr key={mois.month}>
                      <th scope="row">{mois.month}</th>
                      <td>{mois.in}</td>
                      <td>{mois.out}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── Derniers mouvements ───────────────────────────────────────── */}
      <section id="mouvements" className="container-page scroll-mt-24 py-14 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-title font-display font-bold text-ink">Derniers mouvements</h2>
          <Link
            href="/banque-alimentaire/registre"
            className="link-sweep link-tap font-display text-[0.875rem] font-semibold text-ink"
          >
            Registre complet
          </Link>
        </div>

        {banque.movements.length === 0 ? (
          <p className="mt-8 text-[0.9375rem] text-muted">
            Aucun mouvement enregistré pour le moment.
          </p>
        ) : (
          <RevealGroup className="mt-8 grid gap-3 lg:grid-cols-2" stagger={0.05} as="ul">
            {banque.movements.map((mouvement) => (
              <RevealItem key={mouvement.id} as="li">
                <Mouvement mouvement={mouvement} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>

      {/* ── Proposer un don ───────────────────────────────────────────── */}
      {/* ── Donner, ou demander ─────────────────────────────────────────── */}
      {/* La banque a deux portes, et elles se valent : on y dépose, et on y
          prend. N'afficher que la première laisserait croire que demander est
          une faveur qu'il faut solliciter à part. */}
      <section id="agir" className="scroll-mt-24 bg-sand py-14 md:py-20">
        <div className="container-page grid gap-6 md:grid-cols-2">
          <article className="flex flex-col rounded-panel border border-ink/10 bg-paper p-7">
            <h2 className="font-display text-heading font-bold tracking-tight text-ink">
              Apporter une denrée
            </h2>
            <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted">
              Indiquez ce que vous souhaitez déposer et en quelle quantité. Nous convenons d’un
              créneau à l’entrepôt, et votre apport rejoint le registre une fois reçu.
            </p>
            <Link
              href="/banque-alimentaire/apporter"
              className="mt-6 inline-flex w-fit items-center rounded-full bg-ink px-6 py-3.5 font-display text-[0.9375rem] font-semibold text-paper transition-colors hover:bg-ink-deep"
            >
              Faire un don
            </Link>
          </article>

          <article className="flex flex-col rounded-panel border border-ink/10 bg-paper p-7">
            <h2 className="font-display text-heading font-bold tracking-tight text-ink">
              Demander une denrée
            </h2>
            <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted">
              Choisissez un article disponible et la quantité dont vous avez besoin. Votre demande
              est examinée par l’association, qui vous recontacte.
            </p>
            <Link
              href="/banque-alimentaire/demander"
              className="mt-6 inline-flex w-fit items-center rounded-full border border-ink/20 px-6 py-3.5 font-display text-[0.9375rem] font-semibold text-ink transition-colors hover:border-ink/45 hover:bg-mist"
            >
              Faire une demande
            </Link>
          </article>
        </div>
      </section>

      {/* ── Mots reçus ──────────────────────────────────────────────────── */}
      <section id="temoignages" className="container-page scroll-mt-24 py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <h2 className="text-title font-display font-bold text-ink">Ce qu’on nous en dit</h2>
            <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
              Les mots des personnes accompagnées par la banque. Ils paraissent après lecture de
              l’association.
            </p>

            {mots.length === 0 ? (
              <p className="mt-8 rounded-card border border-ink/10 bg-mist px-5 py-8 text-[0.9375rem] text-muted">
                Aucun mot publié pour l’instant.
              </p>
            ) : (
              <ul className="mt-8 space-y-4">
                {mots.map((mot) => (
                  <li key={mot.id} className="rounded-card border border-ink/10 bg-paper p-6">
                    <p className="text-[0.9375rem] leading-relaxed text-ink">« {mot.message} »</p>
                    <p className="mt-3 font-display text-[0.8125rem] font-semibold text-muted">
                      {mot.authorName}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-panel border border-ink/10 bg-mist p-6 md:p-7">
            <h3 className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
              Laisser un mot
            </h3>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">
              Vous avez été accompagné par la banque alimentaire ? Dites-le en quelques lignes.
            </p>
            <div className="mt-5">
              <FoodbankCommentForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
