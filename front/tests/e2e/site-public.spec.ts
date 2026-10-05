import { expect, test } from '@playwright/test';
import { API, attendrePage, texteDe } from './aides';

/**
 * Suite A — le site public répond, affiche son contenu, et ne laisse rien
 * échapper en console.
 */

const ROUTES: { chemin: string; attendu: string[] }[] = [
  { chemin: '/', attendu: ['1001 SADAQA', 'Adhérer'] },
  { chemin: '/a-propos', attendu: ['gouvernance', 'Assemblée générale'] },
  // Les programmes ne sont plus affichés d'emblée : la page présente les
  // quatre domaines, et chacun se déplie sur ses programmes. Leur présence
  // dans le HTML est vérifiée séparément, plus bas.
  { chemin: '/programmes', attendu: ['Protection sociale', 'Autonomisation économique'] },
  { chemin: '/programmes/orphan-care', attendu: ['1001 Orphelins'] },
  { chemin: '/programmes/evenements', attendu: [] },
  { chemin: '/projets/a-financer', attendu: [] },
  { chemin: '/communaute/membre', attendu: ['Pourquoi devenir membre'] },
  { chemin: '/projets', attendu: ['Paniers'] },
  { chemin: '/projets/paniers-solidaires', attendu: ['Paniers'] },
  { chemin: '/actualites', attendu: [] },
  // Les fiches téléchargeables ont été retirées à la demande de
  // l'association : on vérifie désormais le mur de logos, qui reste.
  { chemin: '/communaute/partenaire', attendu: ['Ils nous accompagnent'] },
  { chemin: '/contact', attendu: ['Fidjrossè'] },
  { chemin: '/communaute', attendu: [] },
  { chemin: '/communaute/donateur', attendu: [] },
  { chemin: '/communaute/benevole', attendu: [] },
  { chemin: '/credits', attendu: [] },
  { chemin: '/robots.txt', attendu: [] },
  { chemin: '/sitemap.xml', attendu: [] },
];

/**
 * Formulations qui n'ont rien à faire sur un site en production.
 *
 * Motifs sensibles à la casse : « nan » se cache dans « maintenant » et
 * « financement », une recherche laxiste signalerait la moitié des pages.
 */
const PROSCRITS = [
  /front\/public/i,
  /lorem ipsum/i,
  /TODO/,
  /FIXME/,
  /undefined/,
  /NaN/,
  /\[object Object\]/,
  /Document d’attente/i,
];

for (const route of ROUTES) {
  test(`la page ${route.chemin} répond et affiche son contenu`, async ({ page }) => {
    const erreursConsole: string[] = [];
    const requetesEchouees: string[] = [];

    page.on('console', (m) => {
      if (m.type() === 'error') erreursConsole.push(m.text().slice(0, 160));
    });
    page.on('requestfailed', (r) => {
      // Un préchargement annulé par une navigation n'est pas une panne.
      if (!r.failure()?.errorText.includes('ERR_ABORTED')) {
        requetesEchouees.push(`${r.url().slice(0, 90)} — ${r.failure()?.errorText}`);
      }
    });

    const reponse = await page.goto(route.chemin);
    expect(reponse?.status(), `statut de ${route.chemin}`).toBe(200);

    await attendrePage(page);
    const texte = await texteDe(page);

    for (const attendu of route.attendu) {
      expect(texte, `« ${attendu} » attendu sur ${route.chemin}`).toContain(attendu);
    }
    for (const proscrit of PROSCRITS) {
      expect(texte, `${proscrit} ne doit pas apparaître sur ${route.chemin}`).not.toMatch(proscrit);
    }

    expect(erreursConsole, `erreurs console sur ${route.chemin}`).toEqual([]);
    expect(requetesEchouees, `requêtes échouées sur ${route.chemin}`).toEqual([]);
  });
}

test('les programmes sont tous atteignables depuis la page des domaines', async ({ request }) => {
  // Les huit fiches doivent être liées dans le HTML servi par le serveur :
  // c'est ce qui permet au robot d'indexation de suivre les liens, et à un
  // visiteur sans JavaScript d'y accéder.
  //
  // Le test vérifiait aussi le dépliage des cartes de domaine. Cette liste
  // repliable a été remplacée par une grille où tout est visible d'emblée :
  // il n'y a plus rien à déplier, et c'était l'objet du changement. Ce qui
  // comptait — qu'aucune fiche ne devienne inatteignable — est conservé ici.
  const html = await (await request.get('/programmes')).text();

  const attendus = await (await request.get(`${API}/domains`)).json();
  const slugs = (attendus as { programs?: { slug: string }[] }[]).flatMap((domaine) =>
    (domaine.programs ?? []).map((programme) => programme.slug),
  );

  expect(slugs.length, 'des programmes à vérifier').toBeGreaterThan(0);
  for (const slug of slugs) {
    expect(html, `lien vers /programmes/${slug}`).toContain(`/programmes/${slug}`);
  }
});

test('le mur de logos affiche des images chargées et décrites', async ({ page }) => {
  await page.goto('/communaute/partenaire');
  await attendrePage(page);

  const logos = await page.locator('ul img').evaluateAll((images) =>
    images.map((i) => {
      const img = i as HTMLImageElement;
      return { alt: img.alt, charge: img.complete && img.naturalWidth > 0 };
    }),
  );

  expect(logos.length, 'au moins un logo de partenaire').toBeGreaterThan(0);
  expect(logos.filter((l) => !l.charge).map((l) => l.alt || '(sans alt)')).toEqual([]);
  expect(logos.filter((l) => !l.alt)).toEqual([]);
});

test('un contenu inexistant répond 404 et non une page vide', async ({ page }) => {
  const reponse = await page.goto('/programmes/ce-programme-nexiste-pas');
  expect(reponse?.status()).toBe(404);
});
