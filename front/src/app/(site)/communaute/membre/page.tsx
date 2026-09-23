import type { Metadata } from 'next';
import { MemberForm } from '@/components/forms/MemberForm';
import { PageHero } from '@/components/blocks/PageHero';
import { Reveal } from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'Devenir membre',
  description:
    'Rejoindre une organisation engagée dans la solidarité durable : protection sociale, sécurité alimentaire, santé communautaire et autonomisation.',
};

/** Ce que permet l'adhésion, repris du dossier institutionnel (§13). */
const RAISONS = [
  'Participer à une dynamique de solidarité structurée',
  'Contribuer au développement des programmes de l’ONG',
  'Soutenir la mobilisation de partenaires et de ressources',
  'Participer aux activités et initiatives de l’organisation',
  'Contribuer à la réflexion sur les projets et orientations',
  'Rejoindre une communauté engagée autour de valeurs de dignité, de solidarité et d’impact durable',
];

/** Les six étapes du parcours (§7.4.4). */
const ETAPES = [
  ['Adhésion', 'Votre demande est enregistrée et vous en recevez l’accusé de réception.'],
  ['Validation', 'L’équipe examine la demande et vous répond, quelle que soit la décision.'],
  ['Bienvenue', 'Vous recevez vos identifiants et le premier lien de paiement de cotisation.'],
  ['Participation', 'Vous accédez à votre espace : cotisations, documents, convocations.'],
  ['Fidélisation', 'Rappels d’échéance, information sur l’impact, invitations aux événements.'],
] as const;

export default function MemberPage() {
  return (
    <>
      <PageHero
        eyebrow="Devenir membre"
        lines={['Rejoindre une organisation', 'engagée durablement']}
        lead="Les membres contribuent à la vie de l’organisation et participent, selon les modalités prévues par les statuts, à son développement et à la mise en œuvre de ses programmes."
      />

      <section className="container-page py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div>
            <Reveal from="none">
              <h2 className="font-display text-heading font-bold tracking-tight text-ink">
                Pourquoi devenir membre
              </h2>
            </Reveal>

            <ul className="mt-6 space-y-3">
              {RAISONS.map((raison) => (
                <li
                  key={raison}
                  className="flex gap-3 text-[0.9375rem] leading-relaxed text-muted"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                  {raison}
                </li>
              ))}
            </ul>

            <h3 className="mt-10 font-display text-[1.0625rem] font-bold tracking-tight text-ink">
              Qui peut devenir membre
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
              L’association est ouverte aux personnes qui adhèrent à sa mission, à ses valeurs et à
              ses principes de fonctionnement. Les conditions d’adhésion, les catégories de membres,
              les droits et obligations ainsi que les cotisations sont définis conformément aux
              statuts et au règlement intérieur.
            </p>

            <h3 className="mt-10 font-display text-[1.0625rem] font-bold tracking-tight text-ink">
              Comment se passe l’adhésion
            </h3>
            <ol className="mt-5 space-y-4">
              {ETAPES.map(([titre, texte], index) => (
                <li key={titre} className="flex gap-4">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[0.8125rem] font-bold text-paper">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block font-display text-[0.9375rem] font-semibold text-ink">
                      {titre}
                    </span>
                    <span className="mt-0.5 block text-[0.875rem] leading-relaxed text-muted">
                      {texte}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-panel border border-ink/10 bg-paper p-7 md:p-9">
            <h2 className="font-display text-heading font-bold tracking-tight text-ink">
              Votre demande d’adhésion
            </h2>
            <p className="mt-2 text-[0.9375rem] text-muted">
              Tous les champs marqués d’un astérisque sont nécessaires.
            </p>

            <div className="mt-8">
              <MemberForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
