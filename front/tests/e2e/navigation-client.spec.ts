import { expect, test } from '@playwright/test';
import { ADMIN, allerARubrique, connecter } from './aides';

/**
 * Suite F — la navigation du back-office se fait dans le navigateur.
 *
 * Ce test protège le choix d'architecture : les listes sont lues côté client
 * pour qu'un changement de rubrique ne relance pas un rendu serveur complet.
 * Si quelqu'un remet ces écrans en composants serveur, le compteur d'appels
 * ci-dessous le signalera avant que la lenteur ne revienne.
 */

const RUBRIQUES = [
  ['/admin/programmes', 'Programmes'],
  ['/admin/projets', 'Projets'],
  ['/admin/actualites', 'Actualités'],
  ['/admin/partenaires', 'Partenaires'],
] as const;

test.describe.configure({ mode: 'serial' });
test.skip(!ADMIN.motDePasse, 'E2E_ADMIN_PASSWORD non renseigné');

test('changer de rubrique lit l’API depuis le navigateur', async ({ page }) => {
  await connecter(page);
  await page.locator('main h1').first().waitFor();

  // Première visite : Next compile la route à la demande. On la met de côté.
  for (const [url, titre] of RUBRIQUES) {
    await allerARubrique(page, url);
    await page.locator('main h1', { hasText: titre }).first().waitFor();
  }

  const lectures: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (/\/api\/v1\/(programs|projects|news|partners)\/admin/.test(url)) lectures.push(url);
  });

  for (const [url, titre] of RUBRIQUES) {
    await allerARubrique(page, url);
    await page.locator('main h1', { hasText: titre }).first().waitFor();
    // La liste doit se peupler, pas rester sur sa silhouette d'attente.
    await expect(page.locator('main table tbody tr').first()).toBeVisible();
  }

  expect(
    lectures.length,
    'chaque rubrique est lue par le navigateur, pas par le serveur',
  ).toBeGreaterThanOrEqual(RUBRIQUES.length);
});

test('la silhouette d’attente précède la liste', async ({ page }) => {
  await connecter(page);
  await page.goto('/admin/projets');
  await page.locator('main h1', { hasText: 'Projets' }).first().waitFor();

  // Ralentir l'API pour observer l'état d'attente, autrement trop bref.
  await page.route('**/api/v1/programs/admin', async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });

  await allerARubrique(page, '/admin/programmes');
  await expect(page.locator('main [aria-busy=true]')).toBeVisible();
  await expect(page.locator('main table tbody tr').first()).toBeVisible();
});

test('le jeton d’accès ne traîne pas dans le stockage du navigateur', async ({ page }) => {
  await connecter(page);
  await page.goto('/admin/programmes');
  await page.locator('main table').first().waitFor();

  const stockage = await page.evaluate(() => ({
    local: JSON.stringify(Object.entries(localStorage)),
    session: JSON.stringify(Object.entries(sessionStorage)),
  }));

  // Le jeton vit en mémoire : il disparaît avec l'onglet, et une injection de
  // script ne peut pas le relire après coup.
  expect(stockage.local).not.toMatch(/eyJ|token|jeton/i);
  expect(stockage.session).not.toMatch(/eyJ|token|jeton/i);
});
