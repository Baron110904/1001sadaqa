import { expect, test } from '@playwright/test';
import { ADMIN, attendrePage, connecter } from './aides';

/**
 * Suite E — usage sur téléphone : rien ne doit déborder latéralement, et les
 * cibles tactiles doivent rester atteignables au pouce.
 */

/**
 * iPhone SE : le plus étroit qu'on rencontre encore couramment.
 *
 * L'émulation mobile complète est indispensable, pas seulement la taille : sur
 * un navigateur de bureau la barre de défilement retire une dizaine de pixels
 * à la zone de contenu sans changer `innerWidth`, ce qui faussait la mesure
 * dans les deux sens — masquant un débordement ici, en inventant un là.
 */
test.use({
  viewport: { width: 375, height: 667 },
  // `isMobile` est l'essentiel : il donne les barres de défilement superposées
  // d'un téléphone. On ne diffuse pas un profil d'appareil tout fait — ceux
  // d'iPhone sont décrits pour WebKit et poseraient un agent utilisateur
  // incohérent dans un projet Chromium.
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});

const PUBLIQUES = [
  '/',
  '/a-propos',
  '/programmes',
  '/programmes/evenements',
  '/projets',
  '/projets/a-financer',
  '/actualites',
  '/banque-alimentaire',
  '/banque-alimentaire/registre',
  '/banque-alimentaire/apporter',
  '/banque-alimentaire/demander',
  '/banque-alimentaire/donateurs',
  '/communaute',
  '/communaute/donateur',
  '/communaute/donateur/retour',
  '/communaute/benevole',
  '/communaute/membre',
  '/communaute/partenaire',
  '/contact',
  '/credits',
  '/espace/connexion',
  '/espace/inscription',
];

/**
 * Le débordement horizontal, vu de deux manières complémentaires.
 *
 * `defilementPossible` est la vérité pour l'utilisateur : on pousse la page de
 * côté et on regarde si elle a bougé. Comparer des largeurs ne suffit pas —
 * `scrollWidth` compte les dépassements même lorsque `overflow-x: clip` les
 * rogne, et un élément fixé gonfle la mesure sans rien décaler.
 *
 * `tropLarges` attrape l'autre moitié du problème : une carte réellement trop
 * large reste un défaut de mise en page, même rognée. On ignore donc ce qui
 * est fixé ou confiné par un ancêtre qui rogne, comme un tableau placé dans son
 * propre cadre défilant.
 */
const debordement = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const largeur = document.documentElement.clientWidth;

    const avant = window.scrollX;
    window.scrollTo(9999, 0);
    const defilementPossible = window.scrollX > 0;
    window.scrollTo(avant, 0);

    // La racine est exclue de la recherche d'un ancêtre qui rogne. Elle porte
    // `overflow-x: clip`, posé comme filet de sécurité global : le compter
    // comme un confinement légitime rendait *tout* élément confiné, et la
    // mesure ne signalait plus jamais rien. Vérifié : un bloc de 900 px
    // injecté dans une page de 375 passait inaperçu.
    const confine = (n: Element) => {
      for (
        let a = n.parentElement;
        a && a !== document.body && a !== document.documentElement;
        a = a.parentElement
      ) {
        if (/hidden|clip|auto|scroll/.test(getComputedStyle(a).overflowX)) return true;
      }
      return false;
    };

    // Un élément poussé de côté par une transformation n'est pas mal disposé :
    // il est en cours d'apparition. Les animations d'entrée partent décalées
    // de 26 px et à opacité nulle ; les compter signalait des débordements qui
    // n'existaient que le temps d'un battement de cil.
    const anime = (n: Element) => {
      for (let a: Element | null = n; a && a !== document.body; a = a.parentElement) {
        if (getComputedStyle(a).transform !== 'none') return true;
      }
      return false;
    };

    const tropLarges = [...document.querySelectorAll('body *')]
      .filter((n) => {
        const r = n.getBoundingClientRect();
        return (
          r.right > largeur + 1 &&
          getComputedStyle(n).position !== 'fixed' &&
          !confine(n) &&
          !anime(n)
        );
      })
      .slice(0, 5)
      .map((n) => `${n.tagName.toLowerCase()}.${String(n.className).slice(0, 60)}`);

    return { defilementPossible, tropLarges, largeur };
  });

/**
 * Cibles sous le minimum de 24 × 24 px du critère WCAG 2.2 AA.
 *
 * On mesure l'élément réuni à ses enfants rendus : un lien en ligne dont
 * l'enfant est un bouton rembourré a une boîte plus petite que sa surface
 * visible, et serait signalé à tort.
 */
const ciblesTropPetites = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const zone = (n: Element) => {
      let { top, bottom, left, right } = n.getBoundingClientRect();
      for (const e of n.querySelectorAll('*')) {
        const r = e.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        top = Math.min(top, r.top);
        bottom = Math.max(bottom, r.bottom);
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
      }
      return { largeur: right - left, hauteur: bottom - top };
    };

    return [...document.querySelectorAll('a, button, input[type=checkbox], select')]
      .filter((n) => {
        const r = zone(n);
        if (r.largeur < 2 || r.hauteur < 2) return false;
        const style = getComputedStyle(n);
        if (style.visibility === 'hidden' || style.opacity === '0') return false;
        // Masqué à la vue, comme le lien d'évitement : pas de cible à viser.
        if (style.clipPath && style.clipPath !== 'none') return false;
        return r.hauteur < 24 || r.largeur < 24;
      })
      .slice(0, 10)
      .map((n) => ({
        texte: ((n as HTMLElement).innerText || n.getAttribute('aria-label') || '').slice(0, 30),
        taille: `${Math.round(zone(n).largeur)}×${Math.round(zone(n).hauteur)}`,
      }));
  });

/**
 * Parcourt la page de haut en bas avant de mesurer.
 *
 * Les animations d'entrée se jouent à l'apparition : un bloc encore décalé de
 * 26 px sur la droite ne dit rien de la mise en page, seulement qu'il n'est
 * pas encore arrivé. Mesurée sans ce parcours, la page signalait des
 * débordements qui disparaissaient dès qu'on la lisait.
 */
async function poserLesAnimations(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((suite) => setTimeout(suite, 110));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1000);
}

/**
 * Trois largeurs, choisies pour ce qu'elles cassent.
 *
 * 320 px n'est pas du zèle : c'est là que le bouton « Faire un don » de
 * l'en-tête poussait la commande du menu hors de l'écran, sur toutes les
 * pages du site. Le défaut n'existait qu'en dessous de 375 px.
 */
const LARGEURS = [
  { nom: '320 px', width: 320, height: 568 },
  { nom: '375 px', width: 375, height: 667 },
  { nom: '768 px', width: 768, height: 1024 },
];

for (const largeur of LARGEURS) {
  test.describe(`à ${largeur.nom}`, () => {
    test.use({ viewport: { width: largeur.width, height: largeur.height } });

    for (const chemin of PUBLIQUES) {
      test(`la page ${chemin} tient dans l’écran`, async ({ page }) => {
        await page.goto(chemin);
        await attendrePage(page);
        await poserLesAnimations(page);

        const mesure = await debordement(page);
        expect(mesure.defilementPossible, `${chemin} défile latéralement`).toBe(false);
        expect(mesure.tropLarges, `éléments trop larges sur ${chemin}`).toEqual([]);

        expect(await ciblesTropPetites(page), `cibles tactiles sur ${chemin}`).toEqual([]);
      });
    }
  });
}

test('le menu mobile s’ouvre et mène quelque part', async ({ page }) => {
  await page.goto('/');
  await attendrePage(page);

  const bouton = page.locator('header button').first();
  await expect(bouton).toBeVisible();
  await bouton.click();
  await page.waitForTimeout(900);

  const liens = await page
    .locator('header a, nav a')
    .evaluateAll((ancres) =>
      ancres.filter((a) => a.getBoundingClientRect().height > 0).map((a) => a.getAttribute('href')),
    );
  expect(liens.length, 'liens visibles dans le menu ouvert').toBeGreaterThanOrEqual(4);
});

test('le back-office tient dans un écran de téléphone', async ({ page }) => {
  test.skip(!ADMIN.motDePasse, 'E2E_ADMIN_PASSWORD non renseigné');
  await connecter(page);

  for (const chemin of ['/admin', '/admin/partenaires', '/admin/medias']) {
    await page.goto(chemin);
    await page.locator('main').first().waitFor();
    await page.waitForTimeout(1500);

    const mesure = await debordement(page);
    expect(mesure.defilementPossible, `${chemin} défile latéralement`).toBe(false);
    expect(mesure.tropLarges, `éléments trop larges sur ${chemin}`).toEqual([]);
  }
});
