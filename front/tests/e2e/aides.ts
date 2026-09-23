import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';

/**
 * Outils partagés par les suites de bout en bout.
 */

/** Identifiants du compte d'administration créé par le seed de l'API. */
export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'admin@1001sadaqa.com',
  motDePasse: process.env.E2E_ADMIN_PASSWORD ?? '',
};

/**
 * Marque unique à chaque exécution.
 *
 * Elle rend les enregistrements d'essai reconnaissables, donc supprimables
 * sans risque de toucher aux contenus de l'association.
 */
export const MARQUE = `E2E${Date.now().toString().slice(-6)}`;

/** Texte visible de la page, sans dépendre d'un sélecteur. */
export const texteDe = (page: Page): Promise<string> =>
  page.evaluate(() => document.body?.innerText ?? '');

/**
 * Attend que la page soit posée.
 *
 * `networkidle` est inutilisable ici : en développement, le socket de
 * rechargement à chaud de Next reste ouvert et le réseau ne se tait jamais.
 */
export async function attendrePage(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
}

/**
 * Connexion au back-office ; sans effet si la session est déjà ouverte.
 *
 * La connexion est protégée contre la force brute : cinq tentatives par minute
 * et par adresse. Une suite de tests rapide enchaîne assez de connexions pour
 * l'atteindre — ce qui prouve que la protection fonctionne. On patiente donc
 * et on rejoue, plutôt que de désactiver le garde-fou pour faire passer les
 * tests.
 */
export async function connecter(
  page: Page,
  email = ADMIN.email,
  motDePasse = ADMIN.motDePasse,
): Promise<void> {
  for (let essai = 0; essai < 3; essai++) {
    await page.goto('/admin/login');
    if (!page.url().includes('/login')) return;

    await page.fill('input[name=email]', email);
    await page.fill('input[name=password]', motDePasse);
    await page.click('form button[type=submit]');

    const arrive = await page
      .waitForURL(/\/admin(?!\/login)/, { timeout: 30_000 })
      .then(() => true)
      .catch(() => false);

    if (arrive) {
      await page.locator('main').first().waitFor();
      return;
    }

    const texte = await texteDe(page);
    if (!/Trop de tentatives/i.test(texte)) {
      throw new Error(`Connexion refusée : ${texte.slice(0, 160)}`);
    }

    // La fenêtre de limitation dure une minute.
    await page.waitForTimeout(62_000);
  }

  throw new Error('Connexion impossible après trois tentatives espacées.');
}

/**
 * Va sur un écran d'administration et attend **son** titre.
 *
 * Attendre un sélecteur générique ne suffit pas : la page précédente le
 * satisfait déjà, et la mesure comme l'assertion porteraient sur l'ancien
 * écran.
 */
export async function allerA(page: Page, url: string, titre: string | RegExp): Promise<void> {
  await page.goto(url);
  await page.locator('main h1', { hasText: titre }).first().waitFor();
}

/**
 * Connexion d'un compte public, via l'API.
 *
 * Comme pour l'administration, on patiente devant la limitation anti-force
 * brute au lieu de tomber : une suite rapide enchaîne assez de connexions pour
 * l'atteindre, et c'est la preuve que le garde-fou fonctionne.
 *
 * Seules l'adresse et le mot de passe sont transmis, même si l'appelant en
 * fournit davantage : l'API refuse les propriétés non déclarées, et passer
 * l'objet d'essai entier - qui porte aussi un nom - suffisait à obtenir un 400.
 */
export async function connexionCompte(
  request: APIRequestContext,
  identifiants: { email: string; password: string },
): Promise<string> {
  const { email, password } = identifiants;

  for (let essai = 0; essai < 3; essai++) {
    const session = await request.post(`${API}/accounts/login`, { data: { email, password } });

    if (session.ok()) return ((await session.json()) as { accessToken: string }).accessToken;
    if (session.status() !== 429) {
      throw new Error(`Connexion du compte refusée (${session.status()}).`);
    }

    // La fenêtre de limitation dure une minute.
    await new Promise((suite) => setTimeout(suite, 62_000));
  }

  throw new Error('Connexion du compte impossible après trois tentatives espacées.');
}

/**
 * Clique une rubrique de la navigation du back-office.
 *
 * Les rubriques sont rangées en sections dépliables : un lien peut être
 * présent dans le document sans être visible. On ouvre donc sa section avant
 * de cliquer, comme le ferait la personne devant l'écran.
 */
export async function allerARubrique(page: Page, url: string): Promise<void> {
  const lien = page.locator(`aside nav a[href="${url}"]`).first();
  await lien.waitFor({ state: 'attached' });

  if (!(await lien.isVisible())) {
    // La liste qui porte ce lien est désignée par le bouton de sa section,
    // via `aria-controls` — le lien le plus sûr entre les deux.
    const identifiant = await page
      .locator('aside nav ul[id^="section-"]')
      .filter({ has: page.locator(`a[href="${url}"]`) })
      .first()
      .getAttribute('id');

    if (identifiant) {
      await page.locator(`aside nav button[aria-controls="${identifiant}"]`).click();
      await lien.waitFor();
    }
  }

  await lien.click();
}

/**
 * Ouvre la fiche de modification depuis une ligne de liste.
 *
 * Le délai d'attente est borné court : l'ouverture est mesurée entre 0,3 et
 * 0,7 s, et sans borne un blocage consommait les 240 s du délai global.
 *
 * Le clic est rejoué une fois. Deux exécutions sur une quinzaine ont vu la
 * navigation du routeur de Next rester en suspens : la requête partait sans
 * en-tête de préchargement, le contenu arrivait complet, les fragments de code
 * étaient chargés — et React continuait d'afficher la liste. Aucune erreur, ni
 * dans la page ni sur le serveur, et dix tentatives directes n'ont rien
 * reproduit. La cause est donc dans le routeur client, hors de notre code ;
 * une seconde tentative la contourne sans masquer une panne réelle, qui
 * échouerait deux fois.
 *
 * La reprise recharge la page avant de recliquer : recliquer le même lien
 * pendant qu'une transition vers cette adresse est déjà en suspens ne produit
 * rien. Le rechargement repart d'un routeur vierge, et le second essai porte
 * bien sur un vrai clic.
 */
export async function ouvrirModification(page: Page, ligne: Locator): Promise<void> {
  for (let essai = 0; essai < 2; essai++) {
    if (essai > 0) {
      await page.reload();
      await ligne.waitFor();
    }

    await ligne.locator('a', { hasText: 'Modifier' }).click();
    const ouvert = await page
      .waitForSelector('main form', { timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    if (ouvert) return;
  }
  throw new Error('Le formulaire de modification ne s’est pas affiché après deux clics.');
}

/** Noms des partenaires affichés publiquement, portés par l'attribut alt. */
export const nomsDesLogos = (page: Page): Promise<string[]> =>
  page.locator('ul img').evaluateAll((images) => images.map((i) => (i as HTMLImageElement).alt));

/** Adresse de l'API, telle que le site la voit. */
export const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api/v1';

/**
 * Jeton d'administration, pour les vérifications et le ménage via l'API.
 *
 * Comme `connecter`, cette fonction patiente devant la limitation anti-force
 * brute au lieu de tomber : une suite rapide enchaîne assez de connexions
 * pour l'atteindre, et c'est la preuve que le garde-fou fonctionne. Sans cette
 * patience, un `beforeAll` échouait et emportait toute sa suite avec lui.
 */
export async function jetonAdmin(request: APIRequestContext): Promise<string> {
  for (let essai = 0; essai < 3; essai++) {
    const session = await request.post(`${API}/auth/login`, {
      data: { email: ADMIN.email, password: ADMIN.motDePasse },
    });

    if (session.ok()) return ((await session.json()) as { accessToken: string }).accessToken;

    if (session.status() !== 429) {
      throw new Error(`Connexion à l’API refusée (${session.status()}).`);
    }

    // La fenêtre de limitation dure une minute.
    await new Promise((suite) => setTimeout(suite, 62_000));
  }

  expect(false, 'connexion à l’API après trois tentatives espacées').toBeTruthy();
  throw new Error('inatteignable');
}

/**
 * Retire le média déposé par un test, désigné par son adresse.
 *
 * Supprimer le contenu qui l'utilisait ne suffit pas : le fichier et sa fiche
 * restent en bibliothèque. Sans ce ménage, chaque exécution en laissait un.
 */
export async function supprimerMedia(request: APIRequestContext, url: string): Promise<void> {
  if (!url) return;

  const jeton = await jetonAdmin(request);
  const entetes = { Authorization: `Bearer ${jeton}` };

  const reponse = await request.get(`${API}/media`, { headers: entetes });
  if (!reponse.ok()) return;

  const medias = (await reponse.json()) as { id: string; url: string }[];
  const cible = medias.find((m) => m.url === url);
  if (cible) await request.delete(`${API}/media/${cible.id}`, { headers: entetes });
}
