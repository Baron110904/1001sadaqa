import { expect, test } from '@playwright/test';
import { ADMIN, MARQUE, texteDe } from './aides';

/**
 * Suite B — les quatre formulaires du site public.
 *
 * L'assertion qui compte n'est pas le message affiché mais l'arrivée de
 * l'enregistrement dans le back-office : un libellé peut changer, une demande
 * perdue est un défaut. Les deux sont donc vérifiés.
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api/v1';

/** Les formulaires publics sont limités à 3 à 6 envois par 5 minutes et par IP. */
test.describe.configure({ mode: 'serial' });

test('le formulaire de contact refuse un envoi à vide', async ({ page }) => {
  await page.goto('/contact');
  await page.waitForSelector('form textarea');

  const formulaire = page.locator('form').filter({ has: page.locator('textarea') }).first();
  await formulaire.locator('button[type=submit]').click();
  await page.waitForTimeout(1500);

  expect(await page.locator('form :invalid').count()).toBeGreaterThan(0);
});

test('le formulaire de contact confirme et enregistre', async ({ page }) => {
  await page.goto('/contact');
  await page.waitForSelector('form textarea');

  const formulaire = page.locator('form').filter({ has: page.locator('textarea') }).first();
  await formulaire.locator('input[name=name]').fill(`Essai Contact ${MARQUE}`);
  await formulaire.locator('input[name=email]').fill(`contact.${MARQUE}@example.com`);
  await formulaire.locator('input[name=subject]').fill('Vérification automatique');
  await formulaire.locator('textarea[name=message]').fill('Message de vérification, à supprimer.');
  await formulaire.locator('button[type=submit]').click();

  await expect(page.locator('main')).toContainText('Votre message est parti');
});

test('le formulaire de don mène au règlement', async ({ page, request }) => {
  // L'issue dépend de la configuration de l'association, pas du test : avec la
  // passerelle active le donateur part chez FedaPay, sans elle il reçoit les
  // instructions de règlement. On lit donc l'état réel avant d'affirmer quoi
  // que ce soit — un test qui n'en tiendrait pas compte échouerait le jour où
  // l'association branche les paiements, sans qu'il y ait de défaut.
  const reglages = await (await request.get(`${API}/settings/public`)).json();
  const enLigne = reglages?.payment?.enabled === true;

  await page.goto('/communaute/donateur');
  await page.waitForSelector('form input[name=firstName]');

  const don = page.locator('form').filter({ has: page.locator('input[name=firstName]') }).first();
  await don.locator('input[name=firstName]').fill('Essai');
  await don.locator('input[name=lastName]').fill(`Don ${MARQUE}`);
  await don.locator('input[name=email]').fill(`don.${MARQUE}@example.com`);

  // Pays puis ville. La ville est une liste qui se filtre à la frappe : les
  // pays comptent jusqu'à près de neuf mille communes, qu'on ne fait pas
  // défiler. Elle reste verrouillée tant qu'aucun pays n'est choisi.
  const ville = don.locator('input[name=city]');
  await expect(ville).toBeDisabled();

  await don.locator('#don-country').selectOption({ label: 'Bénin' });
  await expect(ville).toBeEnabled();

  await ville.fill('coton');
  await page.locator('ul[role=listbox] li button', { hasText: 'Cotonou' }).first().click();
  await expect(ville).toHaveValue('Cotonou');

  // Le montant est porté par un champ caché piloté par les boutons : 10 000 F
  // par défaut, rien à saisir.
  expect(await don.locator('input[name=amount]').inputValue()).not.toBe('');

  await don.locator('button[type=submit]').click();

  if (enLigne) {
    // Le don est ouvert chez FedaPay et le navigateur y est envoyé. On
    // s'arrête là : on ne règle pas, on vérifie seulement qu'on y arrive.
    await page.waitForURL(/fedapay\.com/, { timeout: 60_000 });
    expect(page.url()).toMatch(/fedapay\.com/);
    return;
  }

  await page.waitForTimeout(3000);
  expect(await texteDe(page)).toMatch(/instruction|mobile money|virement|Merci|don de/i);
});

test('le formulaire bénévole confirme', async ({ page }) => {
  await page.goto('/communaute/benevole');
  await page.waitForSelector('form input[name=phone]');

  const benevole = page.locator('form').filter({ has: page.locator('input[name=phone]') }).first();
  await benevole.locator('input[name=name]').fill(`Essai Benevole ${MARQUE}`);
  await benevole.locator('input[name=email]').fill(`benevole.${MARQUE}@example.com`);
  await benevole.locator('input[name=phone]').fill('+22990000000');
  await benevole.locator('button[type=submit]').click();

  await expect(page.locator('main')).toContainText('Votre candidature est enregistrée');
});

test('le formulaire de partenariat confirme', async ({ page }) => {
  await page.goto('/communaute/partenaire');
  await page.waitForSelector('form input[name=organisation]');

  const demande = page
    .locator('form')
    .filter({ has: page.locator('input[name=organisation]') })
    .first();
  await demande.locator('input[name=organisation]').fill(`Essai Orga ${MARQUE}`);
  await demande.locator('input[name=contactName]').fill('Responsable Essai');
  await demande.locator('input[name=email]').fill(`orga.${MARQUE}@example.com`);

  const intention = demande.locator('[name=intent]');
  if (await intention.count()) {
    const balise = await intention.first().evaluate((n) => n.tagName);
    if (balise === 'SELECT') await intention.first().selectOption({ index: 1 });
    else await intention.first().fill('Mécénat financier');
  }

  await demande.locator('button[type=submit]').click();
  await expect(page.locator('main')).toContainText('Votre demande est enregistrée');
});

test('les quatre envois sont arrivés dans le back-office', async ({ page, request }) => {
  test.skip(!ADMIN.motDePasse, 'E2E_ADMIN_PASSWORD non renseigné');

  const session = await request.post(`${API}/auth/login`, {
    data: { email: ADMIN.email, password: ADMIN.motDePasse },
  });
  expect(session.ok(), 'connexion à l’API').toBeTruthy();
  const { accessToken } = (await session.json()) as { accessToken: string };
  const entetes = { Authorization: `Bearer ${accessToken}` };

  const lire = async (chemin: string): Promise<Record<string, unknown>[]> => {
    const reponse = await request.get(`${API}${chemin}`, { headers: entetes });
    expect(reponse.ok(), `lecture de ${chemin}`).toBeTruthy();
    const corps = await reponse.json();
    return Array.isArray(corps) ? corps : (corps.items ?? corps.data ?? []);
  };

  const contient = (liste: Record<string, unknown>[], champs: string[]): boolean =>
    liste.some((e) => champs.some((c) => String(e[c] ?? '').includes(MARQUE)));

  expect(contient(await lire('/contacts'), ['name', 'email']), 'message de contact').toBeTruthy();
  expect(contient(await lire('/donations'), ['donorName', 'donorEmail']), 'don').toBeTruthy();
  expect(contient(await lire('/volunteers'), ['name', 'email']), 'candidature').toBeTruthy();
  expect(
    contient(await lire('/partners/admin/requests'), ['organisation', 'email']),
    'demande de partenariat',
  ).toBeTruthy();

  // `page` n'est pas utilisé ici, mais le garder aligne la signature des tests.
  expect(page).toBeDefined();
});
