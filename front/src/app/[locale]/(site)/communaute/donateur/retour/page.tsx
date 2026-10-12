import type { Metadata } from 'next';
import { Lien as Link } from '@/components/ui/Lien';
import { CircleAlert, CircleCheck, Clock } from 'lucide-react';
import { PageHero } from '@/components/blocks/PageHero';
import { ActionLink } from '@/components/ui/Button';
import { formatXof } from '@/lib/format';
import { poserLaLangueDe } from '@/lib/langue';
import { text } from '@/lib/text';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await poserLaLangueDe(params);
  return { title: text('paymentReturn')('metaTitle'), robots: { index: false } };
}

/** Jamais de cache : l'état d'un règlement change d'une seconde à l'autre. */
export const dynamic = 'force-dynamic';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api/v1';

/**
 * Retour depuis la page de règlement FedaPay.
 *
 * L'état n'est pas lu dans l'adresse : il est demandé à l'API, qui le demande
 * elle-même à FedaPay avec la référence enregistrée à l'ouverture. Un
 * paramètre d'URL se falsifie, et ferait passer un don pour encaissé.
 *
 * C'est aussi pour cela que l'adresse de retour ne porte que notre propre
 * identifiant de don : le nom des paramètres que FedaPay ajoute n'est garanti
 * nulle part, et nous n'en dépendons pas.
 */
export default async function RetourPaiementPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ don?: string }>;
}) {
  await poserLaLangueDe(params);
  const { don } = await searchParams;

  const etat = don ? await confirmer(don) : null;

  const cas = !etat
    ? 'inconnu'
    : etat.status === 'COMPLETED'
      ? 'paye'
      : etat.status === 'FAILED'
        ? 'echoue'
        : 'attente';

  // Le remerciement nomme le donateur. Un don anonyme n'a pas de prénom à
  // renvoyer : le merci reste alors impersonnel, comme le reste de ses traces.
  const prenom = etat?.donorFirstName?.trim();
  const t = text('paymentReturn');

  const CONTENU = {
    paye: {
      Icon: CircleCheck,
      teinte: 'text-leaf',
      fond: 'bg-leaf/12',
      titre: prenom ? t('paid.titleNamed').replace('{prenom}', prenom) : t('paid.title'),
      corps: t('paid.body'),
    },
    attente: {
      Icon: Clock,
      teinte: 'text-gold-deep',
      fond: 'bg-gold/15',
      titre: t('pending.title'),
      corps: t('pending.body'),
    },
    echoue: {
      Icon: CircleAlert,
      teinte: 'text-red-700',
      fond: 'bg-red-50',
      titre: t('failed.title'),
      corps: t('failed.body'),
    },
    inconnu: {
      Icon: CircleAlert,
      teinte: 'text-muted',
      fond: 'bg-fog',
      titre: t('unknown.title'),
      corps: t('unknown.body'),
    },
  }[cas];

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} lines={[t('title')]} />

      <section className="container-page py-16 md:py-24">
        <div className="mx-auto max-w-2xl rounded-panel border border-ink/10 bg-mist p-7 md:p-9">
          <span
            className={`flex size-12 items-center justify-center rounded-full ${CONTENU.fond} ${CONTENU.teinte}`}
          >
            <CONTENU.Icon className="size-6" aria-hidden />
          </span>

          <h2 className="mt-6 font-display text-heading font-bold tracking-tight text-ink">
            {CONTENU.titre}
          </h2>

          {/* La référence vient de l'API, qui ne la renvoie que pour un don
              réellement enregistré. Celle de l'adresse de retour s'invente. */}
          {etat?.reference && (
            <p className="mt-3 text-[0.9375rem] text-muted">
              Référence <span className="font-semibold text-ink">{etat.reference}</span>
              {etat.amount ? (
                <>
                  {' · '}
                  <span className="font-semibold text-ink tabular">{formatXof(etat.amount)}</span>
                </>
              ) : null}
            </p>
          )}

          <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">{CONTENU.corps}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <ActionLink href="/" variant="dark">
              {t('backHome')}
            </ActionLink>
            {cas === 'echoue' && (
              <Link
                href="/communaute/donateur"
                className="link-sweep link-tap self-center font-display text-[0.875rem] font-semibold text-ink"
              >
                {t('retry')}
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Demande à l'API de vérifier le règlement auprès de FedaPay.
 *
 * Une panne de cette vérification ne doit pas afficher un échec : le don
 * existe, le paiement a peut-être abouti. On retombe donc sur « en cours »,
 * qui est vrai dans tous les cas où l'on ne sait pas.
 */
async function confirmer(id: string): Promise<{
  status: string;
  amount?: number;
  reference?: string;
  donorFirstName?: string | null;
} | null> {
  try {
    const reponse = await fetch(`${BASE}/donations/${encodeURIComponent(id)}/confirmer`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (reponse.status === 404) return null;
    if (!reponse.ok) return { status: 'PENDING' };

    return (await reponse.json()) as {
      status: string;
      amount?: number;
      reference?: string;
      donorFirstName?: string | null;
    };
  } catch {
    return { status: 'PENDING' };
  }
}
