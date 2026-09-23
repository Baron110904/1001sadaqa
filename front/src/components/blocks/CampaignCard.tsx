import { text } from '@/lib/text';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ActionLink } from '@/components/ui/Button';
import { formatXof, progressRatio } from '@/lib/format';
import type { Campaign } from '@/lib/types';

/**
 * Carte d'une cause à soutenir.
 *
 * Le bouton mène au formulaire de don avec l'affectation déjà positionnée sur
 * le programme de la cause : le visiteur qui clique « Soutenir cette cause »
 * n'a pas à re-choisir où va son don.
 */
export async function CampaignCard({ campaign }: { campaign: Campaign }) {
  const t = text('common');
  const tHome = text('home.causes');

  const ratio = progressRatio(campaign.raised, campaign.goal);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card bg-paper transition-transform duration-500 ease-out hover:-translate-y-1.5">
      <MediaFrame
        src={campaign.image}
        alt={campaign.title}
        placeholder={campaign.program?.shortLabel ?? campaign.title}
        rounded="rounded-none"
        zoomOnHover
        sizes="(max-width: 768px) 100vw, 33vw"
        className="aspect-16/10 w-full"
      />

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-[1.0625rem] leading-snug font-bold tracking-tight text-ink">
          {campaign.title}
        </h3>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{campaign.claim}</p>

        <div className="mt-5">
          <ProgressBar
            ratio={ratio}
            label={`${formatXof(campaign.raised)} ${t('collected')} - ${t('goal')} ${formatXof(campaign.goal)}`}
          />

          <p className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2 text-[0.8125rem]">
            <span className="font-semibold text-ink tabular">
              {formatXof(campaign.raised)} {t('collected')}
            </span>
            <span className="text-muted tabular">
              {t('goal')} {formatXof(campaign.goal)}
            </span>
          </p>
        </div>

        <ActionLink
          href={
            campaign.program
              ? `/communaute/donateur?programme=${campaign.program.slug}`
              : '/communaute/donateur'
          }
          size="sm"
          withArrow={false}
          className="mt-5 w-full"
        >
          {tHome('support')}
        </ActionLink>
      </div>
    </article>
  );
}
