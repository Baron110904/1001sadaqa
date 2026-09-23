import { expect, test } from '@playwright/test';
import { ADMIN, connecter } from './aides';

/**
 * Suite F — le tableau de bord et la navigation du back-office.
 *
 * Deux propriétés qui se cassent facilement et qu'un coup d'œil ne rattrape
 * pas : les compteurs doivent venir de la base et non d'un zéro de repli, et
 * chaque rubrique doit rester atteignable à travers la navigation groupée.
 */

test.describe.configure({ mode: 'serial' });
test.skip(!ADMIN.motDePasse, 'E2E_ADMIN_PASSWORD non renseigné');

test.beforeEach(async ({ page }) => {
  await connecter(page);
  await page.goto('/admin');
  await page.locator('main h1').first().waitFor();
});

test('le tableau de bord affiche des chiffres, pas des tirets', async ({ page }) => {
  const principal = page.locator('main');

  await expect(principal).toContainText(/^Bonjour /m);
  // Le résumé compte ce qui attend une action : le texte diffère au singulier,
  // au pluriel et à zéro, les trois formes sont donc acceptées.
  await expect(principal).toContainText(
    /(Rien n’attend d’action|\d+ éléments? attend(ent)? une action)/,
  );

  // Les quatre tuiles de volume portent un nombre.
  for (const libelle of ['Programmes', 'Projets', 'Actualités', 'Médias à valider']) {
    const tuile = page.locator('main a', { hasText: libelle }).first();
    await expect(tuile, `tuile ${libelle}`).toContainText(/\d/);
  }

  // Le graphique de collecte. Sans aucun don confirmé, six colonnes plates
  // donneraient l'impression d'un graphique cassé : l'écran le dit alors en
  // une phrase. Les deux états sont légitimes, et le test accepte celui qui
  // correspond aux données du moment.
  await expect(principal).toContainText('Collecte de dons');

  const barres = page.locator('main figure div span[style*="height"]');
  if ((await barres.count()) > 0) {
    await expect(barres, 'six mois, six barres').toHaveCount(6);
    // Le tableau des valeurs existe pour les lecteurs d'écran : une hauteur
    // de barre ne leur dit rien.
    await expect(page.locator('main figcaption table')).toHaveCount(1);
  } else {
    await expect(principal).toContainText('Aucun don confirmé');
  }
});

test('le journal liste des faits datés', async ({ page }) => {
  await expect(page.locator('main')).toContainText('Journal');

  const entrees = page.locator('main ol li');
  const total = await entrees.count();

  if (total === 0) {
    // Base vierge : le journal doit l'annoncer, pas rester muet.
    await expect(page.locator('main')).toContainText('Rien à signaler');
    return;
  }

  // Chaque entrée porte une date lisible par la machine.
  await expect(entrees.first().locator('time')).toHaveAttribute('datetime', /\d{4}-\d{2}-\d{2}/);
});

test('la navigation est groupée, se déplie, et mène à chaque rubrique', async ({ page }) => {
  const barre = page.locator('aside nav').first();

  // Les titres sont saisis en capitale initiale ; c'est la feuille de style
  // qui les met en capitales. L'assertion porte donc sur le texte du document,
  // pas sur ce qui s'affiche.
  await expect(barre.locator('p.eyebrow')).toContainText(['Éditorial', 'Relations', 'Réglages']);

  // Les sections fermées cachent leurs entrées sans les retirer du document :
  // un clic doit suffire à les révéler.
  const mediatheque = barre.locator('button[aria-expanded]', { hasText: 'Médiathèque' });
  await expect(mediatheque).toHaveAttribute('aria-expanded', 'false');
  await mediatheque.click();
  await expect(mediatheque).toHaveAttribute('aria-expanded', 'true');
  await expect(barre.locator('a', { hasText: 'Bibliothèque de médias' })).toBeVisible();

  // Toute rubrique de contenu reste joignable.
  const contenus = barre.locator('button[aria-expanded]', { hasText: 'Contenus' });
  if ((await contenus.getAttribute('aria-expanded')) === 'false') await contenus.click();

  for (const libelle of ['Programmes', 'Projets', 'Actualités', 'Campagnes saisonnières']) {
    await expect(barre.locator('a', { hasText: libelle }).first(), libelle).toBeVisible();
  }
});

/*
 * Ce qui n'est pas testé ici, et pourquoi.
 *
 * Le back-office prenait toute erreur de lecture pour une session expirée : il
 * renvoyait au formulaire en purgeant les cookies, et la saisie en cours était
 * perdue. Le correctif distingue l'authentification refusée — seule à mettre
 * fin à la session — d'une API momentanément injoignable, qui remonte
 * désormais à l'écran d'erreur du back-office sans toucher aux cookies.
 *
 * Ce comportement n'est pas couvert à ce niveau : l'appel à `/auth/me` part du
 * serveur Next, pas du navigateur, et `page.route` n'intercepte que les
 * requêtes du navigateur. Le vérifier demanderait d'arrêter l'API en cours de
 * suite, ce qui ferait échouer tout le reste. Il a été contrôlé à la main,
 * API coupée.
 */

test('la colonne de navigation se replie et le choix est retenu', async ({ page }) => {
  const colonne = page.locator('aside').first();
  const bouton = page.locator('aside nav button[aria-pressed]');

  const large = await colonne.evaluate((n) => n.getBoundingClientRect().width);
  await bouton.click();
  await expect(bouton).toHaveAttribute('aria-pressed', 'true');

  const etroite = await colonne.evaluate((n) => n.getBoundingClientRect().width);
  expect(etroite, 'la colonne repliée est plus étroite').toBeLessThan(large);

  // Le repli survit à un rechargement complet : sans cela le bouton ne
  // servirait à rien d'une visite à l'autre.
  await page.reload();
  await page.locator('main h1').first().waitFor();
  await expect(page.locator('aside nav button[aria-pressed]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // On repart d'un état déplié pour ne pas influencer les tests suivants.
  await page.locator('aside nav button[aria-pressed]').click();
  await expect(page.locator('aside nav button[aria-pressed]')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});
