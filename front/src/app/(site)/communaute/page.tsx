import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, HandHeart, HeartHandshake, Users } from 'lucide-react';
import { PageHero } from '@/components/blocks/PageHero';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'Communauté',
  description:
    'Quatre façons de s’engager auprès de 1001 SADAQA : devenir membre, devenir bénévole, devenir partenaire, faire un don.',
};

export const revalidate = 300;

/** Les quatre voies d'engagement (§7.2). */
const VOIES = [
  {
    href: '/communaute/membre',
    icon: Users,
    titre: 'Devenir membre',
    pour: 'Particulier',
    apporte: 'Un engagement durable et une cotisation mensuelle',
    texte:
      'Participer à la vie de l’association, contribuer au développement des programmes et à la réflexion sur les orientations.',
  },
  {
    href: '/communaute/benevole',
    icon: HandHeart,
    titre: 'Devenir bénévole',
    pour: 'Particulier',
    apporte: 'Du temps et des compétences',
    texte:
      'Intervenir sur le terrain ou en appui, ponctuellement ou régulièrement, selon vos disponibilités.',
  },
  {
    href: '/communaute/donateur',
    icon: HeartHandshake,
    titre: 'Faire un don',
    pour: 'Particulier',
    apporte: 'Des ressources financières ou en nature',
    texte:
      'Financer une action précise ou laisser l’association affecter votre don là où le besoin est le plus grand.',
  },
  {
    href: '/communaute/partenaire',
    icon: Building2,
    titre: 'Devenir partenaire',
    pour: 'Entreprise, fondation, institution',
    apporte: 'Financement, compétences, logistique, visibilité',
    texte:
      'Construire une collaboration conventionnée, avec reporting, indicateurs et attestation de contribution.',
  },
] as const;

/** Comparatif des quatre engagements (§7.3). */
const COMPARATIF = [
  ['', 'Membre', 'Bénévole', 'Donateur', 'Partenaire'],
  ['Qui', 'Particulier', 'Particulier', 'Particulier', 'Entreprise, fondation, institution'],
  [
    'Apporte',
    'Engagement durable et cotisation',
    'Temps et compétences',
    'Ressources financières ou en nature',
    'Financement, compétences, logistique, visibilité',
  ],
  [
    'Engagement',
    'Durable, vie associative',
    'Ponctuel ou régulier',
    'Ponctuel ou régulier',
    'Conventionné',
  ],
  [
    'Contrepartie',
    'Participation à la vie de l’ONG',
    'Encadrement et valorisation',
    'Information sur l’impact',
    'Reporting, visibilité, attestation',
  ],
  [
    'Validation',
    'Examen puis validation interne',
    'Qualification du profil',
    'Immédiate',
    'Échange puis convention',
  ],
] as const;

export default function CommunityPage() {
  return (
    <>
      <PageHero
        eyebrow="Communauté"
        lines={['Quatre façons', 'de s’engager']}
        lead="Chacune demande autre chose et apporte autre chose. Choisissez celle qui vous ressemble."
      />

      <section className="container-page py-14 md:py-20">
        <RevealGroup className="grid gap-5 md:grid-cols-2" stagger={0.08}>
          {VOIES.map((voie) => (
            <RevealItem key={voie.href}>
              <Link
                href={voie.href}
                className="group flex h-full flex-col rounded-panel border border-ink/10 bg-paper p-7 transition-colors duration-300 hover:border-ink/25 hover:bg-mist/50"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-leaf/10 text-leaf">
                  <voie.icon className="size-5" strokeWidth={1.9} aria-hidden />
                </span>

                <h2 className="mt-5 font-display text-[1.125rem] font-bold tracking-tight text-ink">
                  {voie.titre}
                </h2>

                <p className="mt-1 text-[0.8125rem] font-semibold text-muted">{voie.pour}</p>

                <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted">
                  {voie.texte}
                </p>

                <p className="mt-5 inline-flex items-center gap-2 font-display text-sm font-semibold text-ink">
                  {voie.titre}
                  <ArrowRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </p>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="bg-mist py-14 md:py-20">
        <div className="container-page">
          <Reveal from="none">
            <h2 className="font-display text-title font-bold tracking-tight text-ink">
              Quelle voie vous correspond
            </h2>
          </Reveal>

          {/* Le tableau défile dans son propre cadre : la page ne déborde pas. */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-ink/15">
                  {COMPARATIF[0].map((entete, index) => (
                    <th
                      key={entete || index}
                      scope="col"
                      className="px-3 py-3 font-display text-[0.8125rem] font-bold text-ink"
                    >
                      {entete}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARATIF.slice(1).map((ligne) => (
                  <tr key={ligne[0]} className="border-b border-ink/8 last:border-0">
                    {ligne.map((cellule, index) => (
                      <td
                        key={index}
                        className={`px-3 py-3 align-top ${
                          index === 0 ? 'font-display font-semibold text-ink' : 'text-muted'
                        }`}
                      >
                        {cellule}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </>
  );
}
