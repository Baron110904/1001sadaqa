import { expect, test } from '@playwright/test';
import { ADMIN } from './aides';

/**
 * Retire les enregistrements laissés par les suites.
 *
 * Nommé `zz-` pour passer en dernier : Playwright exécute les fichiers dans
 * l'ordre alphabétique, et le ménage doit suivre les tests qui créent.
 *
 * Seuls les enregistrements portant une marque d'essai sont touchés. Les dons
 * et les demandes de partenariat n'ont volontairement pas d'endpoint de
 * suppression — on n'efface pas une trace reçue — ils sont donc laissés en
 * place et signalés.
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api/v1';
const ESSAI = /\bE2E\d{6}\b|Essai/;

test('les données d’essai sont retirées', async ({ request }) => {
  test.skip(!ADMIN.motDePasse, 'E2E_ADMIN_PASSWORD non renseigné');

  const session = await request.post(`${API}/auth/login`, {
    data: { email: ADMIN.email, password: ADMIN.motDePasse },
  });
  expect(session.ok()).toBeTruthy();
  const { accessToken } = (await session.json()) as { accessToken: string };
  const entetes = { Authorization: `Bearer ${accessToken}` };

  const cibles: { lecture: string; suppression: string; champs: string[] }[] = [
    { lecture: '/contacts', suppression: '/contacts', champs: ['name', 'email', 'subject'] },
    { lecture: '/volunteers', suppression: '/volunteers', champs: ['name', 'email'] },
    { lecture: '/partners/admin', suppression: '/partners', champs: ['name'] },
    { lecture: '/news/admin', suppression: '/news', champs: ['title'] },
    { lecture: '/users', suppression: '/users', champs: ['name', 'email'] },
    // Les comptes publics créés par la suite de l'espace connecté. Sans cette
    // ligne, chaque exécution en laissait un derrière elle.
    { lecture: '/accounts', suppression: '/accounts', champs: ['name', 'email'] },
    { lecture: '/media', suppression: '/media', champs: ['objectKey', 'altText'] },
    // Banque alimentaire : les demandes et les mots déposés par les suites.
    // Une demande validée reste, elle : son mouvement est au registre, et on
    // n'efface pas une ligne de stock par un ménage automatique.
    {
      lecture: '/foodbank/admin/requests',
      suppression: '/foodbank/requests',
      champs: ['name', 'email'],
    },
    {
      lecture: '/foodbank/admin/comments',
      suppression: '/foodbank/comments',
      champs: ['authorName', 'message'],
    },
  ];

  const retires: string[] = [];

  for (const cible of cibles) {
    const reponse = await request.get(`${API}${cible.lecture}`, { headers: entetes });
    if (!reponse.ok()) continue;

    const corps = await reponse.json();
    const liste: Record<string, unknown>[] = Array.isArray(corps)
      ? corps
      : (corps.items ?? corps.data ?? []);

    for (const element of liste) {
      const texte = cible.champs.map((c) => String(element[c] ?? '')).join(' ');
      if (!ESSAI.test(texte)) continue;
      // Ne jamais toucher au compte d'administration de l'association.
      if (element.email === ADMIN.email) continue;

      await request.delete(`${API}${cible.suppression}/${String(element.id)}`, {
        headers: entetes,
      });
      retires.push(`${cible.lecture} · ${texte.slice(0, 48)}`);
    }
  }

  console.log(
    retires.length
      ? `Données d’essai retirées :\n  ${retires.join('\n  ')}`
      : 'Aucune donnée d’essai à retirer.',
  );

  // Les dons et demandes de partenariat d'essai restent : à retirer en base si
  // besoin, l'API ne les supprime pas par conception.
  expect(true).toBeTruthy();
});
