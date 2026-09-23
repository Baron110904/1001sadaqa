import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  ADMIN,
  API,
  MARQUE,
  allerA,
  attendrePage,
  connecter,
  jetonAdmin,
  ouvrirModification,
  texteDe,
} from './aides';

/**
 * Suite G — l'habillage des campagnes de fête.
 *
 * Le test crée sa propre campagne, l'active, vérifie le site, puis la retire.
 * Les dates sont posées autour d'aujourd'hui : la suite ne dépend pas d'une
 * période de l'année.
 *
 * L'API refuse deux campagnes actives en même temps — c'est voulu. La suite
 * doit donc éteindre celle de l'association le temps de son passage, et la
 * rallumer ensuite.
 *
 * Ce rétablissement est écrit sur le disque avant d'être fait, et rejoué au
 * démarrage de l'exécution suivante. Sans cela, une exécution interrompue
 * laissait la campagne de l'association éteinte **définitivement** : l'état
 * d'origine ne vivait qu'en mémoire, et les passages suivants ne voyaient
 * plus aucune campagne active à rendre. C'est arrivé, et l'habillage du site
 * a disparu sans que rien ne le signale.
 */

test.describe.configure({ mode: 'serial' });
test.skip(!ADMIN.motDePasse, 'E2E_ADMIN_PASSWORD non renseigné');

const JOUR = 86_400_000;

/** Campagne d'essai reprenant la structure d'un Ramadan. */
const campagne = {
  name: `Essai Fête ${MARQUE}`,
  slug: `essai-fete-${MARQUE.toLowerCase()}`,
  theme: 'RAMADAN',
  bannerText: `Campagne d’essai ${MARQUE}.`,
  pillLabel: `Essai ${MARQUE}`,
  greeting: 'رمضان مبارك',
  greetingLatin: 'Ramadan Moubarak',
  heroTitle: 'Trente nuits|pour changer|trente vies.',
  heroLead: 'Chaque soir du mois, votre don finance un iftar complet.',
  ctaLabel: 'Offrir un iftar',
  ctaUrl: '/communaute/donateur',
  secondaryLabel: 'Calculer ma zakât',
  secondaryUrl: '/communaute/donateur',
  goal: 2400,
  progressCurrent: 1480,
  progressUnit: 'iftars',
  marquee: ['Nuit du Destin', 'Zakât al-Fitr', 'Paniers du Ramadan'],
  offers: [
    'Iftar du soir|5000|Nourrit une famille de six personnes.',
    'Nuit du Destin*|50000|Don exceptionnel affecté aux orphelins.',
    'Montant libre||Cumulé avec d’autres dons.',
  ],
  dailyEnabled: true,
  dailyTitle: `Iftar collectif ${MARQUE}`,
  dailyTime: '18:52',
  dailyCount: 240,
  dailyCtaLabel: 'Parrainer un couvert',
};

let idEssai = '';
/** Campagnes que le test a dû désactiver, à réactiver à la fin. */
let rendues: string[] = [];

/**
 * Mémoire du rétablissement, hors du processus.
 *
 * Volontairement pas sous `test-results/`, que Playwright vide à chaque
 * exécution : c'est précisément après une exécution interrompue qu'il faut
 * pouvoir relire ce fichier.
 */
const MEMOIRE = join(__dirname, '.campagnes-a-rendre.json');

async function entetes(request: APIRequestContext) {
  return { Authorization: `Bearer ${await jetonAdmin(request)}` };
}

/** Rallume les campagnes listées et retire la campagne d'essai laissée. */
async function rendre(
  request: APIRequestContext,
  en: Record<string, string>,
  etat: { actives: string[]; essai?: string },
): Promise<void> {
  // La campagne d'essai part d'abord : active, elle recouvre la période de
  // celle de l'association, dont la réactivation serait alors refusée.
  if (etat.essai) await request.delete(`${API}/seasonal-campaigns/${etat.essai}`, { headers: en });

  for (const id of etat.actives) {
    const reponse = await request.patch(`${API}/seasonal-campaigns/${id}`, {
      headers: en,
      data: { isActive: true },
    });
    // On le dit fort : une campagne non rendue, c'est l'habillage du site
    // éteint sans que personne ne l'ait demandé.
    expect(reponse.ok(), `campagne ${id} rendue à l’association`).toBeTruthy();
  }
}

test.beforeAll(async ({ request }) => {
  const en = await entetes(request);

  // Reprise d'une exécution interrompue, avant toute chose.
  if (existsSync(MEMOIRE)) {
    await rendre(request, en, JSON.parse(readFileSync(MEMOIRE, 'utf8')));
    rmSync(MEMOIRE, { force: true });
  }

  const liste = await (await request.get(`${API}/seasonal-campaigns`, { headers: en })).json();
  rendues = (liste as { id: string; isActive: boolean }[])
    .filter((c) => c.isActive)
    .map((c) => c.id);

  // Écrit avant d'éteindre : si le processus meurt entre les deux, le fichier
  // existe déjà et l'exécution suivante remet tout en place.
  writeFileSync(MEMOIRE, JSON.stringify({ actives: rendues }));

  for (const id of rendues) {
    await request.patch(`${API}/seasonal-campaigns/${id}`, {
      headers: en,
      data: { isActive: false },
    });
  }

  // Douze jours écoulés sur trente : la même position que la maquette.
  const debut = new Date(Date.now() - 11 * JOUR).toISOString();
  const fin = new Date(Date.now() + 18 * JOUR).toISOString();

  // Créée éteinte. L'allumage passe par le back-office, dans le premier test :
  // c'est l'enregistrement du formulaire qui invalide le cache des pages. Une
  // bascule faite directement en base resterait invisible jusqu'à cinq
  // minutes, le temps de la revalidation périodique.
  const creation = await request.post(`${API}/seasonal-campaigns`, {
    headers: en,
    data: { ...campagne, startsAt: debut, endsAt: fin, isActive: false },
  });
  expect(creation.ok(), `création de la campagne d’essai : ${creation.status()}`).toBeTruthy();
  idEssai = (await creation.json()).id;

  writeFileSync(MEMOIRE, JSON.stringify({ actives: rendues, essai: idEssai }));
});

test.afterAll(async ({ request }) => {
  const en = await entetes(request);
  await rendre(request, en, { actives: rendues, essai: idEssai });
  rmSync(MEMOIRE, { force: true });
});

test('allumer l’habillage depuis le back-office habille l’accueil', async ({ page }) => {
  await connecter(page);

  await allerA(page, '/admin/campagnes-saisonnieres', 'Campagnes saisonnières');
  const ligne = page.locator('main table tr', { hasText: campagne.name }).first();
  await ouvrirModification(page, ligne);

  await page.check('main input[name=isActive]');
  await page.click('main form button[type=submit]');
  await page.waitForURL(/campagnes-saisonnieres(\?|$)/);

  // L'enregistrement invalide le cache du site : l'accueil doit changer tout
  // de suite, sans attendre la revalidation périodique.
  await page.goto('/');
  await attendrePage(page);
  const texte = await texteDe(page);

  // Le titre de la fête remplace celui de l'accueil : les deux ne coexistent
  // pas, sinon la page s'ouvrirait sur deux bandeaux plein écran.
  await expect(page.locator('h1').first()).toContainText('Trente nuits');
  expect(texte, 'le héros habituel est remplacé').not.toContain('Bienvenue chez 1001 SADAQA');

  // Salutation en arabe, annoncée comme telle aux lecteurs d'écran.
  await expect(page.locator('[lang=ar]').first()).toBeVisible();

  // Calendrier : une case par nuit, et le jour courant sur trente.
  expect(texte).toMatch(/Jour \d+ \/ 30/);
  await expect(page.locator('aside ul li')).toHaveCount(30);

  // Avancement chiffré. Le séparateur de milliers est celui qu'`Intl` choisit
  // — une espace fine insécable, qu'on ne peut pas taper à l'identique — d'où
  // la comparaison souple.
  expect(texte).toContain('iftars déjà financés');
  expect(texte).toMatch(/Objectif\s*2\s*400\s*iftars/);

  // Les deux boutons du héros.
  await expect(page.locator('main a', { hasText: 'Offrir un iftar' }).first()).toBeVisible();
  await expect(page.locator('main a', { hasText: 'Calculer ma zakât' }).first()).toBeVisible();
});

test('les offres mènent au don avec leur montant déjà choisi', async ({ page }) => {
  await page.goto('/');
  await attendrePage(page);

  const cartes = page.locator('main li a[href*="/communaute/donateur"]');
  await expect(cartes.first()).toBeVisible();

  // Une carte chiffrée transmet son montant ; la carte à montant libre n'en
  // transmet aucun et affiche un tiret plutôt qu'un zéro.
  //
  // Correspondance de fin et non de sous-chaîne : « montant=5000 » se
  // retrouve aussi dans « montant=50000 », et les deux cartes auraient
  // compté pour une seule.
  await expect(page.locator('main a[href$="montant=5000"]')).toHaveCount(1);
  await expect(page.locator('main a[href$="montant=50000"]')).toHaveCount(1);
  // Le tiret cadratin a été remplacé par un trait d'union sur tout le site :
  // l'espace réservé au montant libre s'écrit donc « - F ».
  await expect(page.locator('main li', { hasText: 'Montant libre' })).toContainText('- F');
});

test('le décor est présent et purement ornemental', async ({ page }) => {
  await page.goto('/');
  await attendrePage(page);

  // Croissant, halo, étoiles et lanternes.
  //
  // L'identifiant du masque porte un suffixe d'intensité : deux croissants sur
  // une même page — le plein de l'accueil et le discret d'un bandeau — se
  // partageraient sinon le masque du premier, et le second disparaîtrait.
  await expect(page.locator('svg mask[id^="croissant-masque"]')).toHaveCount(1);
  expect(
    await page.locator('span.animate-twinkle').count(),
    'les étoiles scintillent',
  ).toBeGreaterThan(4);

  // Chaque étoile a sa propre durée : synchronisées, elles clignoteraient
  // ensemble au lieu de scintiller.
  const durees = await page
    .locator('span.animate-twinkle')
    .evaluateAll((n) => new Set(n.map((x) => getComputedStyle(x).animationDuration)).size);
  expect(durees, 'des durées de scintillement distinctes').toBeGreaterThan(3);

  // Le halo du croissant respire, et la case du jour du calendrier aussi.
  expect(
    await page.locator('.animate-glow').count(),
    'halo et case du jour',
  ).toBeGreaterThanOrEqual(1);

  // Les lanternes se balancent d'un bloc avec leur fil : le pivot est au point
  // d'accrochage, et le fil est dans l'élément qui tourne.
  const suspensions = await page.locator('span.animate-sway').evaluateAll((spans) =>
    spans.map((s) => ({
      filDedans: Boolean(s.querySelector('span')),
      lanterneDedans: Boolean(s.querySelector('svg')),
      pivot: getComputedStyle(s).transformOrigin.split(' ')[1],
    })),
  );
  expect(suspensions.length, 'des lanternes').toBeGreaterThan(0);
  for (const suspension of suspensions) {
    expect(suspension.filDedans && suspension.lanterneDedans, 'fil et lanterne solidaires').toBe(
      true,
    );
    expect(suspension.pivot, 'pivot au point d’accrochage').toBe('0px');
  }

  // Le décor ne doit rien annoncer : il est marqué comme décoratif, donc
  // aucun de ses textes ne remonte dans la page lue.
  const decor = page.locator('div[aria-hidden]').filter({ has: page.locator('svg') }).first();
  await expect(decor).toHaveAttribute('aria-hidden', 'true');
});

test('la bande du jour reste au bas de l’écran sans masquer le pied de page', async ({ page }) => {
  await page.goto('/');
  await attendrePage(page);

  const bande = page.locator('div.fixed.bottom-0').first();
  // Le libellé « rupture du jeûne » cède la place au compte à rebours dès que
  // la page est affichée ; c'est le test suivant qui contrôle ce texte. Ici on
  // vérifie seulement que la bande porte bien ses informations.
  await expect(bande).toContainText('18:52');
  await expect(bande).toContainText('couverts prévus');

  const hauteurFenetre = await page.evaluate(() => window.innerHeight);

  // La bande entre en glissant de bas en haut sur une demi-seconde, et ce
  // mouvement ne démarre qu'une fois la page hydratée. Mesurer sans attendre
  // la surprenait en chemin, quelques pixels sous le bas de l'écran. On
  // interroge donc jusqu'à ce qu'elle se pose, plutôt que de supposer un délai.
  await expect
    .poll(
      async () => bande.evaluate((n) => Math.round(n.getBoundingClientRect().bottom)),
      { message: 'la bande touche le bas de la fenêtre' },
    )
    .toBe(hauteurFenetre);

  // Défilement jusqu'en bas. Le saut est forcé instantané : l'animation de
  // défilement douce ne serait pas terminée au moment de la mesure, et la
  // page grandit encore au chargement des images.
  for (let essai = 0; essai < 12; essai++) {
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.waitForTimeout(200);
  }

  const basApres = await bande.evaluate((n) => Math.round(n.getBoundingClientRect().bottom));
  expect(basApres, 'la bande ne bouge pas au défilement').toBe(hauteurFenetre);

  // La réserve laissée sous le pied de page vaut exactement la hauteur de la
  // bande : une valeur figée ne tenait pas, la bande s'enroulant sur
  // plusieurs lignes en petite largeur.
  const chevauche = await page.evaluate(() => {
    const barre = document.querySelector('div.fixed.bottom-0');
    const pied = document.querySelector('footer');
    if (!barre || !pied) return null;
    return pied.getBoundingClientRect().bottom > barre.getBoundingClientRect().top + 4;
  });
  expect(chevauche, 'le pied de page reste lisible sous la bande').toBe(false);
});

test('les pages intérieures reçoivent aussi l’habillage', async ({ page }) => {
  for (const chemin of ['/projets', '/a-propos', '/actualites', '/contact']) {
    await page.goto(chemin);
    await attendrePage(page);

    // Pastille dans l'en-tête, et décor dans le bandeau de la page : sans lui,
    // seule la page d'accueil changeait d'aspect.
    await expect(
      page.locator('header a', { hasText: `Essai ${MARQUE}` }),
      `pastille sur ${chemin}`,
    ).toBeVisible();
    await expect(
      page.locator('main svg mask[id^="croissant-masque"]'),
      `croissant sur ${chemin}`,
    ).toHaveCount(1);
    expect(
      await page.locator('main span.animate-twinkle').count(),
      `étoiles sur ${chemin}`,
    ).toBeGreaterThan(2);

    // Le titre de la fête reste à l'accueil : une page intérieure garde le
    // sien.
    await expect(page.locator('h1').first()).not.toContainText('Trente nuits');
  }
});

test('aucune bande claire n’apparaît sous l’en-tête', async ({ page }) => {
  // L'en-tête est collant et non fixé : il occupe sa place dans le flux, donc
  // le contenu n'a aucune hauteur à compenser. Fixé, la compensation devenait
  // fausse dès qu'un bandeau de campagne s'ajoutait au-dessus, et une bande
  // claire apparaissait juste sous l'en-tête.
  await page.goto('/');
  await attendrePage(page);

  const sousEntete = () =>
    page.evaluate(() => {
      const bas = document.querySelector('header')!.getBoundingClientRect().bottom;

      // On remonte les ancêtres jusqu'à trouver qui peint le fond : un élément
      // transparent ne dit rien de ce qu'on voit.
      return [2, 8, 20].map((decalage) => {
        let n = document.elementFromPoint(window.innerWidth / 2, bas + decalage);
        while (n) {
          const style = getComputedStyle(n);
          if (style.backgroundImage !== 'none') return 'degrade';
          if (style.backgroundColor !== 'rgba(0, 0, 0, 0)') return style.backgroundColor;
          n = n.parentElement;
        }
        return 'rien';
      });
    });

  expect(await sousEntete(), 'sous l’en-tête, en haut de page').not.toContain('rgb(255, 255, 255)');

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 240);
  });
  await page.waitForTimeout(500);

  expect(await sousEntete(), 'sous l’en-tête, après défilement').not.toContain(
    'rgb(255, 255, 255)',
  );
});

/*
 * Le bandeau doré haut a été retiré du site : il décalait le contenu et
 * faisait doublon avec la pastille de campagne de l’en-tête. Le test qui
 * vérifiait son apparition au défilement est donc supprimé, et non désactivé
 * — un test ignoré finit par être oublié, puis par mentir.
 */

test('les offres de la période se choisissent dans l’étape Montant', async ({ page }) => {
  await page.goto('/communaute/donateur');
  await attendrePage(page);

  // Les offres ne forment plus une section au-dessus de la page : ce sont des
  // montants, et leur place est parmi les montants. Elles sont donc des
  // boutons du formulaire, plus des liens vers lui.
  // `hasText` en chaîne, pas en expression régulière : la légende est écrite
  // « 2 - Montant » et mise en capitales par la feuille de style. Une
  // expression régulière lit le texte brut et sensiblement à la casse, donc
  // /MONTANT/ ne trouvait rien ; une chaîne cherche sans distinction de casse.
  const etapeMontant = page.locator('fieldset').filter({ hasText: 'Montant' }).first();
  await expect(etapeMontant.getByRole('button', { name: /Iftar du soir/ })).toHaveCount(1);
  await expect(etapeMontant).toContainText(`Essai ${MARQUE}`);
  await expect(page.locator('main').getByRole('link', { name: /Iftar du soir/ })).toHaveCount(0);

  // Une carte cliquée depuis l'accueil transmet son montant par l'URL : à
  // l'arrivée, il est inscrit dans le champ libre et sa carte est cochée.
  await page.goto('/communaute/donateur?montant=50000');
  await attendrePage(page);

  expect(await page.locator('#don-custom').inputValue()).toBe('50000');
  await expect(page.getByRole('button', { name: /Nuit du Destin/ }).first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: /Iftar du soir/ }).first()).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('la bande du jour annonce le temps qui reste', async ({ page }) => {
  await page.goto('/');
  await attendrePage(page);

  const bande = page.locator('div.fixed.bottom-0').first();

  // L'heure de rupture reste affichée, et le compte à rebours la complète. Il
  // est calculé après l'affichage : calculé au rendu serveur, il serait déjà
  // faux à l'arrivée du visiteur.
  await expect(bande).toContainText('18:52');
  await expect(bande).toContainText(/dans \d+ (h|min)|c’est l’heure de l’iftar|rupture du jeûne/);
});

test('l’habillage tient dans un écran de téléphone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await attendrePage(page);

  const mesure = await page.evaluate(() => {
    const avant = window.scrollX;
    window.scrollTo(9999, 0);
    const defile = window.scrollX > 0;
    window.scrollTo(avant, 0);
    return { defile };
  });
  expect(mesure.defile, 'la page ne défile pas latéralement').toBe(false);

  // Les lanternes sont retirées sous la tablette : elles passeraient sur le
  // titre.
  const lanternesVisibles = await page
    .locator('span.animate-sway')
    .evaluateAll((n) => n.filter((x) => (x as HTMLElement).offsetParent !== null).length);
  expect(lanternesVisibles, 'pas de lanternes sur téléphone').toBe(0);

  // La bande du jour reste utilisable.
  await expect(page.locator('div.fixed.bottom-0').first()).toBeVisible();
});
