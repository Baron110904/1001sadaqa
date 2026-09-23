import { expect, test } from '@playwright/test';
import { ADMIN, MARQUE, allerA, connecter, texteDe } from './aides';

/**
 * Suite D — ce que chaque rôle peut atteindre, et ce qui se passe sans session.
 *
 * L'interface ne masque que ce que l'API refuserait de toute façon : les deux
 * niveaux sont vérifiés, la navigation et l'accès direct par l'URL.
 */

const MOT_DE_PASSE_EDITEUR = 'Editeur-Essai-2026';
const EMAIL_EDITEUR = `editeur.${MARQUE}@1001sadaqa.com`;

const RESERVEES = [
  '/admin/programmes',
  '/admin/causes',
  '/admin/equipe',
  '/admin/partenaires',
  '/admin/documents',
  '/admin/parametres',
  '/admin/utilisateurs',
];

const OUVERTES_A_L_EDITEUR = [
  '/admin/projets',
  '/admin/actualites',
  '/admin/temoignages',
  '/admin/missions',
];

test.describe.configure({ mode: 'serial' });
test.skip(!ADMIN.motDePasse, 'E2E_ADMIN_PASSWORD non renseigné');

test('sans session, le back-office renvoie au formulaire en mémorisant la destination', async ({
  page,
  context,
}) => {
  await context.clearCookies();
  await page.goto('/admin/partenaires');

  expect(page.url()).toContain('/admin/login');
  expect(page.url(), 'la destination est mémorisée').toContain('suite=');
});

test('un mot de passe erroné est refusé sans révéler si le compte existe', async ({
  page,
  context,
}) => {
  await context.clearCookies();
  await page.goto('/admin/login');
  await page.fill('input[name=email]', ADMIN.email);
  await page.fill('input[name=password]', 'mauvais-mot-de-passe');
  await page.click('form button[type=submit]');

  await expect(page.locator('main')).toContainText(/incorrect|Trop de tentatives/i);
  expect(await texteDe(page)).not.toMatch(/n’existe pas|inconnu|introuvable/i);
});

test('un éditeur ne voit ni n’atteint les rubriques réservées', async ({ page, context }) => {
  // ── Création du compte, par l'administration ──
  await connecter(page);
  await allerA(page, '/admin/utilisateurs', 'Utilisateurs');

  await page.locator('main button', { hasText: /Créer un compte/ }).first().click();
  await page.waitForSelector('main form input[name=email]');
  await page.fill('main form input[name=name]', `Editeur Essai ${MARQUE}`);
  await page.fill('main form input[name=email]', EMAIL_EDITEUR);
  await page.fill('main form input[name=password]', MOT_DE_PASSE_EDITEUR);
  await page.selectOption('main form select[name=role]', 'EDITOR');
  await page.locator('main form button[type=submit]').first().click();

  await expect(page.locator('main')).toContainText(EMAIL_EDITEUR);

  // ── Connexion en tant qu'éditeur ──
  await context.clearCookies();
  await connecter(page, EMAIL_EDITEUR, MOT_DE_PASSE_EDITEUR);

  const liens = await page
    .locator('nav a')
    .evaluateAll((ancres) => ancres.map((a) => a.getAttribute('href')));

  for (const reservee of RESERVEES) {
    expect(liens, `${reservee} ne doit pas être proposée`).not.toContain(reservee);
  }
  for (const ouverte of OUVERTES_A_L_EDITEUR) {
    expect(liens, `${ouverte} doit être proposée`).toContain(ouverte);
  }

  // L'accès direct par l'URL doit refuser proprement, sans planter.
  for (const url of ['/admin/programmes', '/admin/parametres', '/admin/utilisateurs']) {
    await page.goto(url);
    await page.locator('main').first().waitFor();
    await expect(page.locator('main'), `accès direct à ${url}`).toContainText(
      /non accessible|réservé/i,
    );
  }
});

test('la déconnexion met réellement fin à la session', async ({ page }) => {
  await connecter(page);

  await page.locator('form button', { hasText: /Se déconnecter/ }).first().click();
  await page.waitForURL(/\/admin\/login/);

  // Revenir en arrière ne doit pas rendre l'accès.
  await page.goto('/admin');
  expect(page.url()).toContain('/admin/login');
});
