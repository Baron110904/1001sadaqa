'use client';

import { useActionState, useState } from 'react';
import { CircleCheck, Info } from 'lucide-react';
import { sendFoodbankRequest } from '@/app/actions';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { ActionButton } from '@/components/ui/Button';
import { FormStatus } from '@/components/ui/FormStatus';
import type { SubmitResult } from '@/lib/api';
import type { FoodCategoryState } from '@/lib/types';

/** Ce que le donateur peut apporter hors des catégories déjà suivies. */
const AUTRE = 'autre';

/**
 * Apporter une denrée, ou en demander une.
 *
 * Un seul formulaire pour les deux sens : ce sont les mêmes coordonnées, le
 * même article, la même quantité. Seul change ce qu'on peut viser — on ne
 * réclame que ce que la banque gère, alors qu'on peut apporter autre chose.
 *
 * L'unité suit l'article choisi et ne se saisit pas : elle appartient à la
 * catégorie. La laisser libre produirait des litres de riz.
 */
export function FoodbankRequestForm({
  kind,
  categories,
}: {
  kind: 'DON' | 'RETRAIT';
  categories: FoodCategoryState[];
}) {
  const [state, action, pending] = useActionState<SubmitResult | null, FormData>(
    sendFoodbankRequest,
    null,
  );

  const apport = kind === 'DON';
  const [articleId, setArticleId] = useState('');
  const [uniteLibre, setUniteLibre] = useState('');

  const article = categories.find((categorie) => categorie.id === articleId);
  const horsListe = articleId === AUTRE;
  const unite = horsListe ? uniteLibre.trim() || 'unités' : (article?.unit ?? '');

  if (state?.ok) {
    return (
      <div className="rounded-panel border border-leaf/25 bg-mist p-7 md:p-9">
        <span className="flex size-12 items-center justify-center rounded-full bg-leaf/12 text-leaf">
          <CircleCheck className="size-6" aria-hidden />
        </span>
        <h2 className="mt-6 font-display text-heading font-bold tracking-tight text-ink">
          {apport ? 'Merci - votre apport est enregistré' : 'Votre demande est enregistrée'}
        </h2>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
          {apport
            ? 'L’association vous recontacte pour convenir du dépôt. Le stock affiché sur cette page ne bougera qu’une fois les denrées reçues à l’entrepôt - c’est ce qui garantit que le registre dit vrai.'
            : 'L’association examine votre demande et vous recontacte. La sortie ne sera inscrite au registre qu’au moment de la remise.'}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />

      <FormStatus state={state && !state.ok ? 'error' : 'idle'} message={state?.message} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="banque-nom" name="name" label="Prénom et nom" autoComplete="name" required minLength={2} />
        <TextField
          id="banque-email"
          name="email"
          type="email"
          label="Adresse e-mail"
          autoComplete="email"
          required
        />
      </div>

      <TextField id="banque-tel" name="phone" type="tel" label="Téléphone" autoComplete="tel" />

      <SelectField
        id="banque-article"
        name="categoryId"
        label={apport ? 'Ce que vous apportez' : 'Ce dont vous avez besoin'}
        required
        value={articleId}
        onChange={(evenement) => setArticleId(evenement.target.value)}
      >
        <option value="">Choisissez un article</option>
        {categories.map((categorie) => (
          <option key={categorie.id} value={categorie.id}>
            {categorie.name} ({categorie.unit})
          </option>
        ))}
        {/* Une demande ne porte que sur ce que la banque gère : on ne réclame
            pas un article qui n'existe pas en réserve. */}
        {apport && <option value={AUTRE}>Autre - à préciser</option>}
      </SelectField>

      {horsListe && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="banque-autre"
            name="otherLabel"
            label="Quel article ?"
            required
            minLength={2}
          />
          <TextField
            id="banque-autre-unite"
            name="otherUnit"
            label="Unité"
            placeholder="kg, L, pièces…"
            value={uniteLibre}
            onChange={(evenement) => setUniteLibre(evenement.target.value)}
          />
        </div>
      )}

      <div>
        <label htmlFor="banque-quantite" className="mb-2 block text-sm font-medium text-ink">
          Quantité {unite && <span className="text-muted">en {unite}</span>}
        </label>
        <div className="flex items-center gap-3">
          <input
            id="banque-quantite"
            name="quantity"
            type="number"
            inputMode="decimal"
            min={0.1}
            step="any"
            required
            disabled={!articleId}
            className="w-40 rounded-card border border-ink/15 bg-paper px-4 py-3.5 text-[0.9375rem] text-ink tabular outline-none transition-all hover:border-ink/30 focus:border-gold focus:ring-4 focus:ring-gold/18 disabled:cursor-not-allowed disabled:bg-fog"
          />
          {/* L'unité est affichée, jamais saisie : elle vient de l'article. */}
          <span className="font-display text-[0.9375rem] font-semibold text-ink">
            {unite || <span className="font-sans font-normal text-muted">choisissez un article</span>}
          </span>
        </div>
      </div>

      <TextAreaField
        id="banque-message"
        name="message"
        label={apport ? 'Précisions (facultatif)' : 'Votre situation (facultatif)'}
        rows={4}
      />

      <label className="flex cursor-pointer items-start gap-3 pt-1">
        <input
          type="checkbox"
          name="isAnonymous"
          className="size-6 shrink-0 rounded border-ink/25 text-ink focus:ring-ink/30"
        />
        <span>
          <span className="block text-sm font-medium text-ink">
            {apport ? 'Rendre mon don anonyme' : 'Rendre ma demande anonyme'}
          </span>
          <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-muted">
            Votre nom n’apparaîtra sur aucun affichage public. L’association le conserve pour vous
            recontacter et tenir son registre.
          </span>
        </span>
      </label>

      <p className="flex items-start gap-2.5 rounded-card border border-ink/10 bg-mist p-4 text-[0.8125rem] leading-relaxed text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden />
        {apport
          ? 'Votre apport n’est pas encore compté dans le stock : il le sera quand les denrées seront arrivées à l’entrepôt.'
          : 'Votre demande est examinée par l’association. Elle ne retire rien du stock tant que la remise n’a pas eu lieu.'}
      </p>

      <ActionButton type="submit" variant="dark" disabled={pending} withArrow={!pending}>
        {pending ? 'Envoi en cours…' : apport ? 'Annoncer mon apport' : 'Envoyer ma demande'}
      </ActionButton>
    </form>
  );
}
