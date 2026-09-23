import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/**
 * Identifiants d'administration, repris de la configuration de l'API.
 *
 * Sans eux, les suites qui ouvrent le back-office se sautent d'elles-mêmes —
 * et le ménage de fin avec elles, ce qui laisse les enregistrements d'essai en
 * base. Une exécution affichait alors « 40 passed, 30 skipped » sans que rien
 * ne signale que la moitié du parcours n'avait pas été jouée.
 *
 * Le seed de l'API crée ce compte à partir de `SEED_ADMIN_*` : on lit donc la
 * même source plutôt que de demander de recopier le mot de passe dans une
 * seconde variable. Une valeur déjà présente dans l'environnement l'emporte,
 * pour pouvoir viser une autre installation.
 */
function identifiantsAdmin(): void {
  if (process.env.E2E_ADMIN_PASSWORD) return;

  let contenu: string;
  try {
    // Playwright charge cette configuration en CommonJS : `__dirname` est
    // disponible, `import.meta` non.
    contenu = readFileSync(join(__dirname, '..', 'back', '.env'), 'utf8');
  } catch {
    return; // Pas de fichier : les suites concernées se sauteront, comme avant.
  }

  const lire = (cle: string): string | undefined =>
    contenu.match(new RegExp(`^${cle}\\s*=\\s*"?([^"\r\n]*)"?`, 'm'))?.[1];

  const motDePasse = lire('SEED_ADMIN_PASSWORD');
  const email = lire('SEED_ADMIN_EMAIL');
  if (motDePasse) process.env.E2E_ADMIN_PASSWORD = motDePasse;
  if (email && !process.env.E2E_ADMIN_EMAIL) process.env.E2E_ADMIN_EMAIL = email;
}

identifiantsAdmin();

/**
 * Tests de bout en bout du site et du back-office.
 *
 * Les serveurs ne sont pas démarrés par Playwright : le site a besoin de l'API,
 * de PostgreSQL et de MinIO, que l'on lance une fois pour toutes avec
 * `docker compose up -d` puis les deux `npm run dev`. Les tests s'exécutent
 * contre l'adresse indiquée par `E2E_BASE_URL`, ce qui permet de viser
 * indifféremment un serveur de développement ou une préproduction.
 *
 * Les délais sont larges à dessein : en mode développement, Next compile les
 * routes à la première visite. Sur un cache vide, `/admin/[resource]/[id]` a
 * été mesuré à 147 secondes de compilation — d'où les quatre minutes accordées
 * à une action, sans quoi le premier passage échoue sur une route lente au lieu
 * de signaler un vrai défaut.
 */
export default defineConfig({
  testDir: './tests/e2e',
  // Les suites écrivent en base : les faire tourner en parallèle les ferait
  // se marcher dessus.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 15 * 60 * 1000,
  expect: { timeout: 120_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'tests/rapport' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3100',
    viewport: { width: 1440, height: 950 },
    actionTimeout: 240_000,
    navigationTimeout: 300_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'bureau', use: { ...devices['Desktop Chrome'] } },
  ],
});
