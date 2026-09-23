import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  ADMIN,
  MARQUE,
  allerA,
  attendrePage,
  connecter,
  nomsDesLogos,
  ouvrirModification,
  supprimerMedia,
  texteDe,
} from './aides';

/**
 * Suite C — le cycle de travail complet du back-office : téléverser, créer,
 * publier, modifier, supprimer, et vérifier que le site public suit.
 */

const LOGO = path.resolve(__dirname, '../../../Design/partenaires/Ajanta.jpg');

test.describe.configure({ mode: 'serial' });
test.skip(!ADMIN.motDePasse, 'E2E_ADMIN_PASSWORD non renseigné');

test.beforeEach(async ({ page }) => {
  await connecter(page);
});

test('un fichier obligatoire manquant est refusé en français', async ({ page }) => {
  await allerA(page, '/admin/partenaires/nouveau', 'Nouveau partenaire');

  await page.fill('main input[name=name]', `Sans logo ${MARQUE}`);
  await page.click('main form button[type=submit]');

  await expect(page.locator('main')).toContainText('Choisissez un fichier');
});

test('le cycle complet d’un partenaire, du téléversement à la suppression', async ({
  page,
  request,
}) => {
  const nom = `Ajanta Essai ${MARQUE}`;

  // ── Téléversement ──
  await allerA(page, '/admin/partenaires/nouveau', 'Nouveau partenaire');
  await page.setInputFiles('main input[type=file]', LOGO);

  const adresse = page.locator('main input[type=hidden][name=logo]');
  await expect
    .poll(async () => (await adresse.inputValue()).length, { message: 'adresse du logo' })
    .toBeGreaterThan(0);
  const urlLogo = await adresse.inputValue();

  // Le fichier doit être réellement servi, sans authentification.
  const fichier = await page.request.get(urlLogo);
  expect(fichier.status(), 'le logo téléversé est joignable').toBe(200);

  // ── Création ──
  await page.fill('main input[name=name]', nom);
  await expect(page.locator('main input[name=isActive]'), 'visible par défaut').toBeChecked();
  await page.click('main form button[type=submit]');
  await page.waitForURL(/\/admin\/partenaires(\?|$)/);
  await expect(page.locator('main table')).toContainText(nom);

  // ── Le site public suit, sans attendre la revalidation ──
  await page.goto('/communaute/partenaire');
  await attendrePage(page);
  expect(await nomsDesLogos(page), 'partenaire visible sur le site').toContain(nom);

  // ── Modification ──
  await allerA(page, '/admin/partenaires', 'Partenaires');
  const ligne = page.locator('main table tr', { hasText: nom }).first();
  await ouvrirModification(page, ligne);

  expect(
    (await page.inputValue('main input[type=hidden][name=logo]')).length,
    'le logo est conservé à la réouverture',
  ).toBeGreaterThan(0);

  const nomModifie = `${nom} modifié`;
  await page.fill('main input[name=name]', nomModifie);
  await page.click('main form button[type=submit]');
  await page.waitForURL(/\/admin\/partenaires(\?|$)/);
  await expect(page.locator('main table')).toContainText(nomModifie);

  // ── Suppression en deux temps ──
  const ligneModifiee = page.locator('main table tr', { hasText: nomModifie }).first();
  await ligneModifiee.locator('button', { hasText: 'Supprimer' }).click();
  await expect(ligneModifiee).toContainText('Confirmer');
  await ligneModifiee.locator('button', { hasText: 'Oui, supprimer' }).click();

  await expect(page.locator('main')).not.toContainText(nomModifie);

  // Le fichier déposé survit à la suppression du partenaire : on le retire.
  await supprimerMedia(request, urlLogo);
});

test('une actualité n’est visible du public qu’une fois publiée', async ({ page }) => {
  const titre = `Brouillon Essai ${MARQUE}`;

  await allerA(page, '/admin/actualites/nouveau', 'Nouvelle actualité');
  await page.fill('main input[name=title]', titre);
  await page.fill('main textarea[name=content]', 'Contenu de vérification automatique.');
  await page.click('main form button[type=submit]');
  await page.waitForURL(/\/admin\/actualites(\?|$)/);

  await page.goto('/actualites');
  await attendrePage(page);
  expect(await texteDe(page), 'un brouillon reste privé').not.toContain(titre);

  // ── Publication ──
  await allerA(page, '/admin/actualites', 'Actualités');
  await ouvrirModification(page, page.locator('main table tr', { hasText: titre }).first());
  await page.check('main input[name=isPublished]');
  await page.click('main form button[type=submit]');
  await page.waitForURL(/\/admin\/actualites(\?|$)/);

  await page.goto('/actualites');
  await attendrePage(page);
  expect(await texteDe(page), 'une actualité publiée apparaît').toContain(titre);

  // ── Ménage ──
  await allerA(page, '/admin/actualites', 'Actualités');
  const ligne = page.locator('main table tr', { hasText: titre }).first();
  await ligne.locator('button', { hasText: 'Supprimer' }).click();
  await ligne.locator('button', { hasText: 'Oui, supprimer' }).click();
  await expect(page.locator('main')).not.toContainText(titre);
});

test('un fichier trop lourd est refusé avant l’envoi', async ({ page }) => {
  await allerA(page, '/admin/partenaires/nouveau', 'Nouveau partenaire');

  // Le fichier est fabriqué dans la page : 26 Mo ne traversent pas le pilote.
  await page.evaluate(() => {
    const champ = document.querySelector('main input[type=file]') as HTMLInputElement;
    const gros = new File([new Uint8Array(26 * 1024 * 1024)], 'trop-lourd.jpg', {
      type: 'image/jpeg',
    });
    const transfert = new DataTransfer();
    transfert.items.add(gros);
    champ.files = transfert.files;
    champ.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await expect(page.locator('main [role=alert]')).toContainText('La limite est de 25 Mo');
  expect(await page.inputValue('main input[type=hidden][name=logo]')).toBe('');
});
