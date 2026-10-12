import type { Metadata } from 'next';
import { Lien as Link } from '@/components/ui/Lien';
import { redirect } from 'next/navigation';
import { HandCoins, HeartHandshake, UserCheck } from 'lucide-react';
import { PageHero } from '@/components/blocks/PageHero';
import { compteFetch, SessionCompteFinie } from '@/lib/compte/session';
import { fermerSession } from '@/lib/compte/actions';
import { formatXof } from '@/lib/format';
import { poserLaLangueDe } from '@/lib/langue';
import { text } from '@/lib/text';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await poserLaLangueDe(params);
  return { title: text('account.space')('metaTitle'), robots: { index: false, follow: false } };
}

/** Ce que renvoie `/accounts/me/overview`. */
interface Espace {
  account: { id: string; email: string; name: string; phone: string | null };
  member: {
    status: string;
    pledgedAmount: number;
    joinedAt: string | null;
    contributions: { id: string; amount: number; period: string; status: string }[];
  } | null;
  donations: {
    id: string;
    amount: number;
    method: string;
    status: string;
    isAnonymous: boolean;
    createdAt: string;
    program: { title: string; slug: string } | null;
  }[];
  volunteering: {
    id: string;
    status: string;
    preference: string | null;
    mission: string | null;
    createdAt: string;
  }[];
  partners: { id: string; name: string; logo: string }[];
}

const ETATS: Record<string, string> = {
  PENDING: 'bg-gold/20 text-gold-deep',
  EN_ATTENTE: 'bg-gold/20 text-gold-deep',
  COMPLETED: 'bg-leaf/12 text-leaf',
  CONFIRME: 'bg-leaf/12 text-leaf',
  ACTIF: 'bg-leaf/12 text-leaf',
  ACCEPTED: 'bg-leaf/12 text-leaf',
  REJECTED: 'bg-ink/8 text-muted',
  REFUSE: 'bg-ink/8 text-muted',
  FAILED: 'bg-ink/8 text-muted',
};

function Etat({ valeur }: { valeur: string }) {
  const ton = ETATS[valeur] ?? 'bg-ink/8 text-muted';
  // Un état inconnu s'affiche tel quel plutôt que de laisser un vide : mieux
  // vaut un code brut qu'aucune indication sur l'état d'une demande.
  const libelle = text('account.space.states')(valeur);

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-display text-[0.6875rem] font-bold tracking-wide uppercase ${ton}`}
    >
      {libelle === valeur ? valeur : libelle}
    </span>
  );
}

const enDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Espace personnel.
 *
 * Il ne montre que ce que la personne a elle-même confié à l'association, lu
 * côté serveur à partir de son jeton — jamais d'un identifiant transmis par le
 * navigateur. La page n'est pas indexable : elle n'a rien à faire dans un
 * moteur de recherche.
 */
export default async function EspacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await poserLaLangueDe(params);
  const t = text('account.space');
  let espace: Espace;
  try {
    espace = await compteFetch<Espace>('/accounts/me/overview');
  } catch (cause) {
    if (cause instanceof SessionCompteFinie) redirect('/espace/connexion');
    throw cause;
  }

  const total = espace.donations
    .filter((don) => don.status === 'COMPLETED')
    .reduce((somme, don) => somme + don.amount, 0);

  const vide =
    espace.donations.length === 0 &&
    espace.volunteering.length === 0 &&
    !espace.member &&
    espace.partners.length === 0;

  return (
    <>
      {/* Pas d'adresse e-mail sous le bonjour : elle n'apprend rien à qui est
          déjà connecté, et s'affiche en grand sur un écran qu'on peut montrer
          à quelqu'un. Elle reste consultable dans les réglages du compte. */}
      <PageHero
        eyebrow={t('eyebrow')}
        lines={[`${t('greeting')} ${espace.account.name.split(' ')[0]}`]}
      />

      <section className="container-page py-14 md:py-20">
        {vide ? (
          <div className="rounded-panel border border-dashed border-ink/20 bg-mist px-6 py-12 text-center">
            <p className="font-display text-[1.0625rem] font-bold text-ink">
              {t('emptyTitle')}
            </p>
            <p className="mx-auto mt-2 max-w-lg text-[0.9375rem] leading-relaxed text-muted">
              {t('emptyBody')}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/communaute/donateur"
                className="inline-flex items-center rounded-full bg-ink px-5 py-3 font-display text-[0.875rem] font-semibold text-paper"
              >
                {t('donateCta')}
              </Link>
              <Link
                href="/communaute/membre"
                className="inline-flex items-center rounded-full border border-ink/20 px-5 py-3 font-display text-[0.875rem] font-semibold text-ink"
              >
                {t('memberCta')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {/* ── Dons ── */}
            <article className="rounded-panel border border-ink/10 bg-paper p-6 lg:col-span-2">
              <header className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="flex items-center gap-2.5 font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                  <HandCoins className="size-5 text-leaf" aria-hidden />
                  {t('giftsTitle')}
                </h2>
                {total > 0 && (
                  <p className="text-[0.875rem] text-muted">
                    {formatXof(total)} confirmés au total
                  </p>
                )}
              </header>

              {espace.donations.length === 0 ? (
                <p className="mt-4 text-[0.9375rem] text-muted">{t('noGift')}</p>
              ) : (
                <ul className="mt-5 divide-y divide-ink/8">
                  {espace.donations.map((don) => (
                    <li key={don.id} className="flex items-start justify-between gap-4 py-3.5">
                      <span>
                        <span className="block font-display text-[0.9375rem] font-semibold text-ink tabular">
                          {formatXof(don.amount)}
                          {don.isAnonymous && (
                            <span className="ml-2 text-[0.75rem] font-medium text-muted">
                              anonyme
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-[0.8125rem] text-muted">
                          {enDate(don.createdAt)}
                          {don.program ? ` · ${don.program.title}` : ' · besoin le plus urgent'}
                        </span>
                      </span>
                      <Etat valeur={don.status} />
                    </li>
                  ))}
                </ul>
              )}
            </article>

            {/* ── Adhésion ── */}
            <article className="rounded-panel border border-ink/10 bg-paper p-6">
              <h2 className="flex items-center gap-2.5 font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                <UserCheck className="size-5 text-leaf" aria-hidden />
                Adhésion
              </h2>

              {espace.member ? (
                <>
                  <p className="mt-4 flex flex-wrap items-center gap-3">
                    <Etat valeur={espace.member.status} />
                    <span className="text-[0.875rem] text-muted">
                      {formatXof(espace.member.pledgedAmount)} par mois
                    </span>
                  </p>

                  {espace.member.contributions.length > 0 && (
                    <ul className="mt-5 divide-y divide-ink/8">
                      {espace.member.contributions.slice(0, 6).map((versement) => (
                        <li
                          key={versement.id}
                          className="flex items-center justify-between gap-3 py-2.5"
                        >
                          <span className="text-[0.875rem] text-ink tabular">
                            {formatXof(versement.amount)}
                            <span className="ml-2 text-[0.75rem] text-muted">
                              {new Date(versement.period).toLocaleDateString('fr-FR', {
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          </span>
                          <Etat valeur={versement.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                    {t('notMember')}
                  </p>
                  <Link
                    href="/communaute/membre"
                    className="link-sweep link-tap mt-4 inline-block font-display text-[0.875rem] font-semibold text-ink"
                  >
                    {t('askMembership')}
                  </Link>
                </>
              )}
            </article>

            {/* ── Bénévolat et partenariats ── */}
            {(espace.volunteering.length > 0 || espace.partners.length > 0) && (
              <article className="rounded-panel border border-ink/10 bg-paper p-6 lg:col-span-3">
                <h2 className="flex items-center gap-2.5 font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                  <HeartHandshake className="size-5 text-leaf" aria-hidden />
                  {t('commitmentsTitle')}
                </h2>

                <ul className="mt-5 divide-y divide-ink/8">
                  {espace.volunteering.map((candidature) => (
                    <li
                      key={candidature.id}
                      className="flex items-start justify-between gap-4 py-3.5"
                    >
                      <span>
                        <span className="block font-display text-[0.9375rem] font-semibold text-ink">
                          {t('volunteerApplication')}
                          {candidature.mission ? ` · ${candidature.mission}` : ''}
                        </span>
                        <span className="mt-0.5 block text-[0.8125rem] text-muted">
                          Déposée le {enDate(candidature.createdAt)}
                        </span>
                      </span>
                      <Etat valeur={candidature.status} />
                    </li>
                  ))}

                  {espace.partners.map((partenaire) => (
                    <li key={partenaire.id} className="py-3.5">
                      <span className="block font-display text-[0.9375rem] font-semibold text-ink">
                        {partenaire.name}
                      </span>
                      <span className="mt-0.5 block text-[0.8125rem] text-muted">
                        {t('partnerRep')}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            )}
          </div>
        )}

        <form action={fermerSession} className="mt-10">
          <button
            type="submit"
            className="link-sweep link-tap font-display text-[0.875rem] font-semibold text-muted transition-colors hover:text-ink"
          >
            {t('signOut')}
          </button>
        </form>
      </section>
    </>
  );
}
