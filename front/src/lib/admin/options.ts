import { adminFetch } from './client';
import type { FieldDef } from './resources';

interface ProgramOption {
  id: string;
  title: string;
}

/**
 * Charge les listes d'options que les descripteurs déclarent en `optionsFrom`.
 *
 * Seules les sources réellement utilisées par les champs de la ressource sont
 * interrogées : ouvrir un formulaire de témoignage ne doit pas déclencher un
 * appel inutile à la liste des programmes.
 */
export async function loadDynamicOptions(
  fields: FieldDef[],
): Promise<Record<string, { value: string; label: string }[]>> {
  const sources = new Set(
    fields
      .map((field) => field.optionsFrom)
      .filter((source): source is NonNullable<FieldDef['optionsFrom']> => !!source),
  );

  const options: Record<string, { value: string; label: string }[]> = {};

  if (sources.has('programs')) {
    const programs = await adminFetch<ProgramOption[]>('/programs/admin');
    options.programs = programs.map((program) => ({
      value: program.id,
      label: program.title,
    }));
  }

  if (sources.has('domains')) {
    const domains = await adminFetch<{ id: string; name: string }[]>('/domains/admin');
    options.domains = domains.map((domain) => ({ value: domain.id, label: domain.name }));
  }

  if (sources.has('foodCategories')) {
    const categories = await adminFetch<{ id: string; name: string; unit: string }[]>(
      '/foodbank/admin/categories',
    );
    options.foodCategories = categories.map((categorie) => ({
      value: categorie.id,
      label: `${categorie.name} (${categorie.unit})`,
    }));
  }

  return options;
}
