import { expect, test, type APIRequestContext } from '@playwright/test';
import { API, MARQUE, attendrePage, jetonAdmin, texteDe } from './aides';

/**
 * Suite J — apporter et demander à la banque alimentaire.
 *
 * La propriété qui compte n'est pas qu'un formulaire s'envoie : c'est que le
 * stock ne bouge **qu'à la validation**. Entre le clic d'un donateur et
 * l'arrivée du sac à l'entrepôt, il y a un trajet qui n'aboutit pas toujours ;
 * un registre qui compterait les intentions annoncerait des denrées que
 * personne n'a vues.
 */

test.describe.configure({ mode: 'serial' });

const apport = {
  nom: `Essai Apport ${MARQUE}`,
  email: `apport.${MARQUE.toLowerCase()}@exemple.test`,
};

/** Premier article de la réserve, avec son unité et son stock du moment. */
async function article(request: APIRequestContext) {
  const banque = await (await request.get(`${API}/foodbank`)).json();
  return banque.categories[0] as { id: string; name: string; unit: string; quantity: number };
}

test('l’unité suit l’article choisi, et la quantité attend ce choix', async ({ page }) => {
  await page.goto('/banque-alimentaire/apporter');
  await page.waitForSelector('form input[name=name]');
  await attendrePage(page);

  // Tant qu'aucun article n'est choisi, il n'y a pas d'unité : saisir une
  // quantité n'aurait pas de sens.
  await expect(page.locator('input[name=quantity]')).toBeDisabled();

  const premier = await page
    .locator('#banque-article option')
    .nth(1)
    .getAttribute('value');
  await page.locator('#banque-article').selectOption(premier!);

  await expect(page.locator('input[name=quantity]')).toBeEnabled();
  // L'unité est affichée à côté du champ, jamais saisie.
  await expect(page.locator('label[for=banque-quantite]')).toContainText('en');

  // « Autre » ouvre un libellé libre : on peut apporter ce que la banque ne
  // suit pas encore.
  await page.locator('#banque-article').selectOption('autre');
  await expect(page.locator('input[name=otherLabel]')).toBeVisible();
});

test('une demande de retrait ne porte que sur un article existant', async ({ page }) => {
  await page.goto('/banque-alimentaire/demander');
  await attendrePage(page);

  const options = await page.locator('#banque-article option').allTextContents();
  expect(options.length, 'des articles sont proposés').toBeGreaterThan(1);
  expect(
    options.some((option) => option.includes('Autre')),
    'aucun « Autre » : on ne réclame pas ce que la banque ne gère pas',
  ).toBe(false);
});

test('un apport annoncé ne bouge pas le stock ; sa validation le bouge', async ({
  page,
  request,
}) => {
  const avant = await article(request);

  await page.goto('/banque-alimentaire/apporter');
  await page.waitForSelector('form input[name=name]');
  await attendrePage(page);

  await page.fill('input[name=name]', apport.nom);
  await page.fill('input[name=email]', apport.email);
  await page.locator('#banque-article').selectOption(avant.id);
  await page.fill('input[name=quantity]', '9');
  await page.click('form button[type=submit]');

  await expect(page.locator('main')).toContainText('enregistré');
  // Le message promet explicitement que rien n'a encore bougé.
  expect(await texteDe(page)).toMatch(/une fois les denrées|ne bougera/i);

  const pendant = await article(request);
  expect(pendant.quantity, 'le stock n’a pas bougé au dépôt').toBe(avant.quantity);

  // ── Validation côté association ──
  const entetes = { Authorization: `Bearer ${await jetonAdmin(request)}` };
  const demandes = await (
    await request.get(`${API}/foodbank/admin/requests?kind=DON`, { headers: entetes })
  ).json();
  const deposee = (demandes as { id: string; email: string }[]).find(
    (ligne) => ligne.email === apport.email,
  );
  expect(deposee, 'la demande est arrivée au back-office').toBeTruthy();

  const validation = await request.patch(`${API}/foodbank/requests/${deposee!.id}`, {
    headers: entetes,
    data: { status: 'APPROVED' },
  });
  expect(validation.ok(), `validation : ${validation.status()}`).toBeTruthy();

  const apres = await article(request);
  expect(apres.quantity, 'la validation a écrit l’entrée au registre').toBe(avant.quantity + 9);

  // Une demande comptée ne se rejoue pas : le registre ferait foi d'un stock
  // qui n'existe plus.
  const marcheArriere = await request.patch(`${API}/foodbank/requests/${deposee!.id}`, {
    headers: entetes,
    data: { status: 'REJECTED' },
  });
  expect(marcheArriere.status(), 'retour en arrière refusé').toBe(400);

  // ── Ménage : on retire le mouvement qu'on vient d'écrire ──
  const mouvements = await (await request.get(`${API}/foodbank/movements?limit=10`)).json();
  const ecrit = (mouvements as { id: string; counterpart: string }[]).find(
    (ligne) => ligne.counterpart === apport.nom,
  );
  if (ecrit) await request.delete(`${API}/foodbank/movements/${ecrit.id}`, { headers: entetes });

  const retabli = await article(request);
  expect(retabli.quantity, 'stock rendu à sa valeur d’avant').toBe(avant.quantity);
});

test('un mot déposé attend d’être lu avant de paraître', async ({ page }) => {
  await page.goto('/banque-alimentaire');
  await attendrePage(page);

  const mot = `Essai Mot ${MARQUE}`;
  await page.fill('input[name=authorName]', mot);
  await page.fill(
    'textarea[name=message]',
    'Les paniers ont beaucoup aidé ma famille cette année.',
  );
  await page.locator('form:has(textarea[name=message]) button[type=submit]').click();

  await expect(page.locator('main')).toContainText('une fois lu');

  // Il ne doit pas être visible tant qu'il n'est pas publié.
  await page.reload();
  await attendrePage(page);
  expect(await texteDe(page)).not.toContain(mot);
});

test('le classement écarte les dons anonymes', async ({ page, request }) => {
  const cible = await article(request);

  const anonyme = await request.post(`${API}/foodbank/requests`, {
    data: {
      kind: 'DON',
      name: `Essai Anonyme ${MARQUE}`,
      email: `anonyme.${MARQUE.toLowerCase()}@exemple.test`,
      categoryId: cible.id,
      quantity: 4,
      isAnonymous: true,
    },
  });
  expect(anonyme.ok(), `dépôt anonyme : ${anonyme.status()}`).toBeTruthy();

  const entetes = { Authorization: `Bearer ${await jetonAdmin(request)}` };
  const { id } = (await anonyme.json()) as { id: string };
  await request.patch(`${API}/foodbank/requests/${id}`, {
    headers: entetes,
    data: { status: 'APPROVED' },
  });

  await page.goto('/banque-alimentaire/donateurs');
  await attendrePage(page);
  expect(await texteDe(page)).not.toContain(`Essai Anonyme ${MARQUE}`);

  // Ménage du mouvement créé pour ce test.
  const mouvements = await (await request.get(`${API}/foodbank/movements?limit=10`)).json();
  const ecrit = (mouvements as { id: string; counterpart: string }[]).find(
    (ligne) => ligne.counterpart === 'Donateur anonyme',
  );
  if (ecrit) await request.delete(`${API}/foodbank/movements/${ecrit.id}`, { headers: entetes });
});
