import type { Metadata } from 'next';
import Link from 'next/link';
import { CircleAlert, CircleCheck, Clock } from 'lucide-react';
import { PageHero } from '@/components/blocks/PageHero';
import { ActionLink } from '@/components/ui/Button';
import { formatXof } from '@/lib/format';

export const metadata: Metadata = { title: 'Retour de paiement', robots: { index: false } };

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
  searchParams,
}: {
  searchParams: Promise<{ don?: string }>;
}) {
  const { don } = await searchParams;

  const etat = don ? await confirmer(don) : null;

  const cas = !etat
    ? 'inconnu'
    : etat.status === 'COMPLETED'
      ? 'paye'
      : etat.status === 'FAILED'
        ? 'echoue'
        : 'attente';

  const CONTENU = {
    paye: {
      Icon: CircleCheck,
      teinte: 'text-leaf',
      fond: 'bg-leaf/12',
      titre: 'Merci - votre don est encaissé',
      corps:
        'Le règlement est confirmé. Un reçu vous est adressé par e-mail, et un compte rendu d’affectation vous parvient chaque trimestre.',
    },
    attente: {
      Icon: Clock,
      teinte: 'text-gold-deep',
      fond: 'bg-gold/15',
      titre: 'Votre don est enregistré, le règlement est en cours',
      corps:
        'FedaPay ne nous a pas encore confirmé le paiement. Si vous venez de le valider, il peut arriver dans les minutes qui suivent - vous n’avez rien à refaire. L’association vérifie de son côté.',
    },
    echoue: {
      Icon: CircleAlert,
      teinte: 'text-red-700',
      fond: 'bg-red-50',
      titre: 'Le règlement n’a pas abouti',
      corps:
        'Aucun montant n’a été prélevé. Vous pouvez réessayer ; si le problème persiste, écrivez-nous et nous trouverons une autre voie.',
    },
    inconnu: {
      Icon: CircleAlert,
      teinte: 'text-muted',
      fond: 'bg-fog',
      titre: 'Nous ne retrouvons pas ce don',
      corps:
        'Le lien de retour est incomplet. Si vous avez été débité, écrivez-nous avec la date et le montant : nous rapprocherons le paiement.',
    },
  }[cas];

  return (
    <>
      <PageHero eyebrow="Faire un don" lines={['Retour de paiement']} />

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

          {etat && (
            <p className="mt-3 text-[0.9375rem] text-muted">
              Référence <span className="font-semibold text-ink">{don}</span>
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
              Revenir à l’accueil
            </ActionLink>
            {cas === 'echoue' && (
              <Link
                href="/communaute/donateur"
                className="link-sweep link-tap self-center font-display text-[0.875rem] font-semibold text-ink"
              >
                Refaire un don
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
async function confirmer(id: string): Promise<{ status: string; amount?: number } | null> {
  try {
    const reponse = await fetch(`${BASE}/donations/${encodeURIComponent(id)}/confirmer`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (reponse.status === 404) return null;
    if (!reponse.ok) return { status: 'PENDING' };

    return (await reponse.json()) as { status: string; amount?: number };
  } catch {
    return { status: 'PENDING' };
  }
}
