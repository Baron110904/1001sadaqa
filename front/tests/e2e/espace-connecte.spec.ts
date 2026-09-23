import { expect, test } from '@playwright/test';
import { API, MARQUE, attendrePage, connexionCompte } from './aides';

/**
 * Suite I — l'espace connecté des membres, bénévoles, donateurs et partenaires.
 *
 * Deux propriétés valent plus que les autres, et ce sont celles que ce fichier
 * protège : une session de compte public n'ouvre rien du back-office, et
 * réciproquement ; et le jeton ne quitte jamais les cookies httpOnly.
 */

const compte = {
  name: `Essai Espace ${MARQUE}`,
  email: `espace.${MARQUE.toLowerCase()}@exemple.test`,
  password: 'phrase-de-passe-longue',
};

test.describe.configure({ mode: 'serial' });

test('sans session, l’espace renvoie au formulaire', async ({ page }) => {
  await page.goto('/espace');
  await attendrePage(page);
  expect(page.url()).toContain('/espace/connexion');
});

test('créer un compte ouvre l’espace, et le jeton reste hors de portée', async ({ page }) => {
  await page.goto('/espace/inscription');
  await attendrePage(page);

  await page.fill('input[name=name]', compte.name);
  await page.fill('input[name=email]', compte.email);
  await page.fill('input[name=password]', compte.password);
  await page.click('form button[type=submit]');

  await page.waitForURL(/\/espace$/, { timeout: 60_000 });
  await expect(page.locator('main h1')).toContainText('Bonjour');

  // Le jeton vit dans un cookie httpOnly : un script injecté dans la page ne
  // peut pas le lire, et il ne traîne pas dans le stockage du navigateur.
  const stockage = await page.evaluate(() => [
    ...Object.keys(localStorage),
    ...Object.keys(sessionStorage),
  ]);
  expect(stockage.filter((cle) => /token|jeton/i.test(cle))).toEqual([]);

  const cookies = (await page.context().cookies()).filter((c) => c.name.includes('compte'));
  expect(cookies.length, 'deux cookies de session').toBe(2);
  for (const cookie of cookies) {
    expect(cookie.httpOnly, `${cookie.name} est httpOnly`).toBe(true);
  }
});

test('un mot de passe erroné est refusé sans révéler si le compte existe', async ({ page }) => {
  await page.goto('/espace/connexion');
  await attendrePage(page);

  await page.fill('input[name=email]', compte.email);
  await page.fill('input[name=password]', 'mauvais-mot-de-passe');
  await page.click('form button[type=submit]');
  await page.waitForTimeout(2500);

  expect(page.url(), 'on reste sur le formulaire').toContain('/espace/connexion');
  await expect(page.locator('[role=alert]').first()).toContainText('Identifiants incorrects');

  // Une adresse inconnue reçoit exactement le même message : sinon le
  // formulaire dirait qui est inscrit.
  await page.fill('input[name=email]', `inconnu.${MARQUE.toLowerCase()}@exemple.test`);
  await page.fill('input[name=password]', 'mauvais-mot-de-passe');
  await page.click('form button[type=submit]');
  await page.waitForTimeout(2500);
  await expect(page.locator('[role=alert]').first()).toContainText('Identifiants incorrects');
});

test('la déconnexion met fin à la session', async ({ page }) => {
  await page.goto('/espace/connexion');
  await attendrePage(page);
  await page.fill('input[name=email]', compte.email);
  await page.fill('input[name=password]', compte.password);
  await page.click('form button[type=submit]');
  await page.waitForURL(/\/espace$/, { timeout: 60_000 });

  await page.click('form button:has-text("Me déconnecter")');
  await page.waitForURL(/\/espace\/connexion/, { timeout: 30_000 });

  // Et l'espace n'est plus atteignable.
  await page.goto('/espace');
  await attendrePage(page);
  expect(page.url()).toContain('/espace/connexion');
});

test('les deux authentifications sont cloisonnées', async ({ request }) => {
  const accessToken = await connexionCompte(request, compte);

  // Un jeton de compte public n'ouvre aucune porte du back-office. La
  // séparation tient à deux choses : l'audience du jeton, et le fait que
  // chaque stratégie cherche son porteur dans sa propre table.
  const admin = await request.get(`${API}/programs/admin`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(admin.status(), 'le back-office refuse un jeton de compte').toBe(401);
});

/*
 * Pas de nettoyage ici : le compte d’essai porte la marque de l’exécution,
 * et la suite de ménage le retire en fin de parcours comme les autres
 * enregistrements. Le faire à deux endroits ferait diverger les deux.
 */
