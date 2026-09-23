'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { text } from '@/lib/text';
import { mesurer, tranche } from '@/lib/mesure';
import { CircleCheck, Info } from 'lucide-react';
import { sendDonation, type DonationState } from '@/app/actions';
import { SelectField, TextField } from '@/components/ui/Field';
import { VilleField } from '@/components/ui/VilleField';
import { PAYS } from '@/lib/pays';
import type { Offre } from '@/lib/seasonal';
import { ActionButton, ActionLink } from '@/components/ui/Button';
import { FormStatus } from '@/components/ui/FormStatus';
import { formatXof } from '@/lib/format';
import type { DonationFrequency, DonationMethod, PaymentSettings, ProgramRef } from '@/lib/types';

const PRESETS = [5000, 10000, 25000, 50000] as const;

interface DonationFormProps {
  programs: ProgramRef[];
  payment: PaymentSettings;
  /** Offres de la fête en cours, à proposer parmi les montants. */
  seasonal: { label: string; offers: Offre[] } | null;
  /** Valeurs transportées par l'URL depuis l'encart « don rapide » ou une cause. */
  initial: { amount?: number; email?: string; programSlug?: string };
}

/**
 * Formulaire de don en quatre étapes, avec récapitulatif persistant.
 *
 * Le récapitulatif reste visible pendant la saisie (collant sur grand écran) :
 * le donateur voit en permanence ce qu'il s'engage à donner et à quoi il
 * l'affecte. Les moyens de paiement proposés viennent de la configuration du
 * back-office, pas d'une liste figée dans le code.
 */
export function DonationForm({ programs, payment, seasonal, initial }: DonationFormProps) {
  const t = text('donate');
  const tCommon = text('common');

  const [state, action, pending] = useActionState<DonationState | null, FormData>(
    sendDonation,
    null,
  );

  // Un montant reçu par l'URL - carte d'offre, encart « don rapide », lien
  // partagé - s'inscrit toujours dans le champ libre, qu'il coïncide ou non
  // avec un montant courant. Il ne s'y inscrivait pas quand il tombait juste :
  // arriver par « Nuit du Destin » à 50 000 F laissait le champ vide, alors
  // que cliquer la même somme dans la page le remplissait. Le donateur voit
  // désormais sa somme écrite, d'où qu'il vienne.
  const [amount, setAmount] = useState<number>(initial.amount ?? 10000);
  const [custom, setCustom] = useState(initial.amount ? String(initial.amount) : '');
  const [frequency, setFrequency] = useState<DonationFrequency>('ONE_TIME');
  const [programId, setProgramId] = useState(
    programs.find((program) => program.slug === initial.programSlug)?.id ?? '',
  );
  const [method, setMethod] = useState<DonationMethod>(payment.methods[0] ?? 'MOBILE_MONEY');

  // Le pays commande la liste des villes. Aucun pays n'est présélectionné :
  // en poser un d'office ferait enregistrer celui-là chaque fois que le
  // donateur ne regarde pas le champ, et la donnée ne vaudrait plus rien.
  //
  // `pays` porte le code ISO, pour retrouver le fichier des villes ; c'est le
  // nom en toutes lettres qui part au serveur, via un champ caché.
  const [pays, setPays] = useState('');
  const [ville, setVille] = useState('');
  const nomDuPays = PAYS.find((entree) => entree.code === pays)?.nom ?? '';

  const finalAmount = custom ? Number(custom) : amount;
  const tooLow = !finalAmount || finalAmount < 500;
  const allocation = programs.find((program) => program.id === programId);

  // ── Écran de confirmation ──
  // Mesuré à l'arrivée du reçu : un envoi refusé par le serveur ne doit pas
  // compter comme une conversion.
  useEffect(() => {
    if (state?.ok && state.receipt) {
      mesurer('don_enregistre', {
        tranche: tranche(state.receipt.amount),
        moyen: state.receipt.method,
      });
    }
  }, [state]);

  if (state?.ok && state.receipt) {
    const { receipt } = state;

    return (
      <div className="mx-auto max-w-2xl rounded-panel border border-leaf/25 bg-mist p-7 md:p-9">
        <span className="flex size-12 items-center justify-center rounded-full bg-leaf/12 text-leaf">
          <CircleCheck className="size-6" aria-hidden />
        </span>

        <h2 className="mt-6 font-display text-heading font-bold tracking-tight text-ink">
          {t('success.title')}
        </h2>

        <p className="mt-3 text-[0.9375rem] text-muted">
          {t('success.reference')} <span className="font-semibold text-ink">{receipt.id}</span>
        </p>

        <p className="mt-6 font-display text-3xl font-bold tracking-tight text-ink tabular">
          {formatXof(receipt.amount)}
        </p>

        {/* Cet écran n'est atteint qu'en règlement hors ligne : quand la
            passerelle est active, l'action serveur a déjà envoyé le donateur
            sur la page FedaPay, et il revient par `/communaute/donateur/retour`. */}
        {receipt.gateway.mode === 'manual' && (
          <div className="mt-7 rounded-card border border-ink/10 bg-paper p-5">
            <p className="flex items-start gap-2.5 text-sm text-ink">
              <Info className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden />
              {t('success.manualIntro')}
            </p>

            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
              {receipt.gateway.instructions}
            </p>
          </div>
        )}

        <p className="mt-6 text-[0.8125rem] text-muted">{t('summary.note')}</p>

        {/* Le compte est proposé **après** le don, jamais avant : placer une
            inscription devant le formulaire ferait renoncer une partie des
            donateurs. Ici le geste est fait, et le compte ne sert qu'à le
            retrouver plus tard. Le rattachement se fera sur l'adresse déjà
            saisie, sans rien redemander. */}
        <div className="mt-7 rounded-card border border-ink/10 bg-mist p-5">
          <p className="font-display text-[0.9375rem] font-bold text-ink">
            {t('success.accountTitle')}
          </p>
          <p className="mt-1.5 text-[0.875rem] leading-relaxed text-muted">
            {t('success.accountBody')}
          </p>
          <Link
            href="/espace/inscription"
            className="link-sweep link-tap mt-3 inline-block font-display text-[0.875rem] font-semibold text-ink"
          >
            {t('success.accountCta')}
          </Link>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <ActionLink href="/" variant="dark">
            {t('success.backHome')}
          </ActionLink>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
      {/* Champs pilotés par les boutons : ils portent l'état réel envoyé. */}
      <input type="hidden" name="amount" value={finalAmount || ''} />
      <input type="hidden" name="frequency" value={frequency} />
      <input type="hidden" name="programId" value={programId} />
      <input type="hidden" name="method" value={method} />

      <div className="space-y-9">
        {/* ── 1. Fréquence ── */}
        <fieldset>
          <legend className="eyebrow text-leaf">{t('steps.frequency')}</legend>

          <div className="mt-3 inline-flex rounded-full bg-fog p-1">
            {(['ONE_TIME', 'MONTHLY'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFrequency(option)}
                aria-pressed={frequency === option}
                className={`rounded-full px-5 py-2.5 font-display text-[0.875rem] font-semibold transition-all duration-300 active:scale-[0.97] ${
                  frequency === option ? 'bg-ink text-paper shadow-soft' : 'text-muted hover:text-ink'
                }`}
              >
                {option === 'ONE_TIME' ? t('frequency.oneTime') : t('frequency.monthly')}
              </button>
            ))}
          </div>
        </fieldset>

        {/* ── 2. Montant ── */}
        <fieldset>
          <legend className="eyebrow text-leaf">{t('steps.amount')}</legend>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRESETS.map((preset) => {
              // La carte reste sélectionnée tant que le champ libre porte sa
              // valeur : puisque le clic le remplit, la comparaison se fait
              // désormais sur le montant retenu, pas sur l'absence de saisie.
              const active = finalAmount === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  // Le montant choisi remplit le champ libre au lieu de le
                  // vider : le donateur voit tout de suite ce qu'il va donner,
                  // et peut l'ajuster sans avoir à ressaisir depuis zéro.
                  onClick={() => {
                    setAmount(preset);
                    setCustom(String(preset));
                  }}
                  aria-pressed={active}
                  className={`rounded-card border p-4 text-left transition-all duration-300 active:scale-[0.98] ${
                    active
                      ? 'border-ink bg-ink text-paper'
                      : 'border-ink/15 bg-paper text-ink hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-soft'
                  }`}
                >
                  <span className="block font-display text-lg leading-tight font-bold tabular">
                    {formatXof(preset)}
                  </span>
                  <span
                    className={`mt-1.5 block text-[0.75rem] leading-snug ${
                      active ? 'text-paper/70' : 'text-muted'
                    }`}
                  >
                    {t(`amounts.a${preset}`)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Offres de la fête en cours ──
              Elles vivent ici, parmi les montants, et non en tête de page :
              une carte cliquée depuis l'accueil arrive avec son montant dans
              l'URL, et se retrouve donc sélectionnée sous les yeux du
              donateur au lieu de disparaître. */}
          {seasonal && seasonal.offers.length > 0 && (
            <div className="mt-6">
              <p className="eyebrow text-gold-deep">{seasonal.label}</p>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {seasonal.offers.map((offre, index) => {
                  const active = offre.amount !== null && finalAmount === offre.amount;

                  return (
                    <button
                      key={`${offre.label}-${index}`}
                      type="button"
                      // Une offre à montant libre ne fixe rien : elle vide le
                      // champ pour que le donateur inscrive sa somme.
                      onClick={() => {
                        if (offre.amount === null) {
                          setCustom('');
                          return;
                        }
                        setAmount(offre.amount);
                        setCustom(String(offre.amount));
                      }}
                      aria-pressed={active}
                      className={`flex flex-col rounded-card border p-4 text-left transition-all duration-300 active:scale-[0.98] ${
                        active
                          ? 'border-gold bg-gold text-ink'
                          : 'border-gold/35 bg-gold/8 text-ink hover:-translate-y-0.5 hover:border-gold hover:shadow-soft'
                      }`}
                    >
                      <span className="font-display text-[0.9375rem] leading-snug font-bold">
                        {offre.label}
                      </span>
                      <span className="mt-2 font-display text-lg leading-none font-bold tabular">
                        {/* Un « 0 F » se lirait comme un don nul. */}
                        {offre.amount ? formatXof(offre.amount) : ' - F'}
                      </span>
                      {offre.description && (
                        <span className="mt-2 text-[0.75rem] leading-snug text-muted">
                          {offre.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-3">
            <label htmlFor="don-custom" className="mb-2 block text-sm font-medium text-ink">
              {t('amounts.customLabel')}
            </label>
            <input
              id="don-custom"
              type="number"
              inputMode="numeric"
              min={500}
              step={500}
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              placeholder={t('amounts.custom')}
              className="w-full max-w-xs rounded-card border border-ink/15 bg-paper px-4 py-3.5 text-[0.9375rem] text-ink tabular outline-none transition-all placeholder:text-muted/70 hover:border-ink/30 focus:border-gold focus:ring-4 focus:ring-gold/18"
            />
            {custom && tooLow && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {t('amounts.minimum')}
              </p>
            )}
          </div>
        </fieldset>

        {/* ── 3. Affectation ── */}
        <fieldset>
          <legend className="eyebrow text-leaf">{t('steps.allocation')}</legend>

          <div className="mt-3 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setProgramId('')}
              aria-pressed={programId === ''}
              className={`rounded-full border px-4 py-2.5 font-display text-[0.8125rem] font-semibold transition-all duration-300 active:scale-[0.97] ${
                programId === ''
                  ? 'border-gold bg-gold text-ink'
                  : 'border-ink/15 text-ink hover:border-ink/40'
              }`}
            >
              {t('allocation.urgent')}
            </button>

            {programs.map((program) => (
              <button
                key={program.id}
                type="button"
                onClick={() => setProgramId(program.id)}
                aria-pressed={programId === program.id}
                className={`rounded-full border px-4 py-2.5 font-display text-[0.8125rem] font-semibold transition-all duration-300 active:scale-[0.97] ${
                  programId === program.id
                    ? 'border-gold bg-gold text-ink'
                    : 'border-ink/15 text-ink hover:border-ink/40'
                }`}
              >
                {program.shortLabel}
              </button>
            ))}
          </div>
        </fieldset>

        {/* ── 4. Coordonnées ── */}
        <fieldset>
          <legend className="eyebrow text-leaf">{t('steps.details')}</legend>

          <div className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                id="don-first"
                name="firstName"
                label={t('fields.firstName')}
                autoComplete="given-name"
                required
                minLength={2}
              />
              <TextField
                id="don-last"
                name="lastName"
                label={t('fields.lastName')}
                autoComplete="family-name"
                required
              />
            </div>

            <TextField
              id="don-email"
              name="email"
              type="email"
              label={t('fields.email')}
              autoComplete="email"
              defaultValue={initial.email}
              required
            />

            <TextField
              id="don-phone"
              name="phone"
              type="tel"
              label={t('fields.phone')}
              autoComplete="tel"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="country" value={nomDuPays} />

              <SelectField
                id="don-country"
                label={t('fields.country')}
                autoComplete="country-name"
                required
                value={pays}
                // Changer de pays vide la ville : garder « Cotonou » après un
                // passage au Sénégal enverrait une adresse qui n'existe pas.
                onChange={(event) => {
                  setPays(event.target.value);
                  setVille('');
                }}
              >
                <option value="">{t('fields.countryPlaceholder')}</option>
                {PAYS.map((entree) => (
                  <option key={entree.code} value={entree.code}>
                    {entree.nom}
                  </option>
                ))}
              </SelectField>

              <VilleField
                pays={pays}
                valeur={ville}
                onChange={setVille}
                label={t('fields.city')}
                placeholder={t('fields.cityPlaceholder')}
                attente={t('fields.cityWaiting')}
              />
            </div>
          </div>

          {/* Anonymat public.

              La case ne dispense pas de donner son nom : l'association en a
              besoin pour le reçu et la comptabilité. Elle retire seulement le
              nom des affichages publics - c'est ce que dit l'aide, pour qu'on
              ne coche pas en croyant devenir invisible. */}
          <label className="mt-5 flex cursor-pointer items-start gap-3">
            {/* 24 px au moins : c'est le minimum tactile, et la case est la
                seule cible de cette zone sur un téléphone. */}
            <input
              type="checkbox"
              name="isAnonymous"
              className="size-6 shrink-0 rounded border-ink/25 text-ink focus:ring-ink/30"
            />
            <span>
              <span className="block text-sm font-medium text-ink">
                {t('fields.anonymous')}
              </span>
              <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-muted">
                {t('fields.anonymousHelp')}
              </span>
            </span>
          </label>

          {payment.methods.length > 1 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-ink">{t('methods.label')}</p>
              <div className="flex flex-wrap gap-2.5">
                {payment.methods.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMethod(option)}
                    aria-pressed={method === option}
                    className={`rounded-full border px-4 py-2.5 font-display text-[0.8125rem] font-semibold transition-all duration-300 active:scale-[0.97] ${
                      method === option
                        ? 'border-ink bg-ink text-paper'
                        : 'border-ink/15 text-ink hover:border-ink/40'
                    }`}
                  >
                    {t(`methods.${option}`)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </fieldset>
      </div>

      {/* ── Récapitulatif ── */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-panel bg-ink p-6 md:p-7">
          <p className="eyebrow text-gold">{t('summary.title')}</p>

          <p className="mt-4 font-display text-4xl leading-none font-bold tracking-tight text-paper tabular">
            {formatXof(finalAmount || 0)}
            {frequency === 'MONTHLY' && (
              <span className="ml-2 font-sans text-sm font-medium text-paper/55">
                {t('summary.perMonth')}
              </span>
            )}
          </p>

          <dl className="mt-6 space-y-3 border-t border-paper/12 pt-5 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-paper/55">{t('summary.allocation')}</dt>
              <dd className="text-right font-semibold text-paper">
                {allocation ? allocation.shortLabel : t('allocation.urgent')}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-paper/55">{t('summary.frequency')}</dt>
              <dd className="font-semibold text-paper">
                {frequency === 'ONE_TIME' ? t('frequency.oneTime') : t('frequency.monthly')}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-paper/55">{t('summary.methods')}</dt>
              <dd className="text-right font-semibold text-paper">{t(`methods.${method}`)}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <FormStatus state={state && !state.ok ? 'error' : 'idle'} message={state?.message} />
          </div>

          <ActionButton
            type="submit"
            size="lg"
            disabled={pending || tooLow}
            withArrow={false}
            className="mt-5 w-full"
          >
            {pending ? tCommon('sending') : t('summary.submit')}
          </ActionButton>

          <p className="mt-4 text-[0.75rem] leading-relaxed text-paper/50">
            {t('summary.note')}
          </p>
        </div>
      </aside>
    </form>
  );
}
