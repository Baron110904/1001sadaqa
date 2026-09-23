# Tests de bout en bout

Six suites qui pilotent un vrai navigateur contre le site et le back-office.
Elles écrivent en base : à lancer sur un environnement de développement ou de
préproduction, jamais sur la production.

## Une fois, à l'installation

Playwright a besoin de son propre navigateur (environ 115 Mo) :

```bash
cd front && npx playwright install chromium
```

Un Chromium d'une autre version déjà présent sur le poste ne convient pas :
Playwright attend la révision exacte qui accompagne sa version, et échoue sinon
avec `Executable doesn't exist`.

## Lancer

Les serveurs ne sont pas démarrés par les tests — le site a besoin de l'API, de
PostgreSQL et de MinIO. Dans trois terminaux :

```bash
docker compose up -d          # PostgreSQL + MinIO
cd back  && npm run start:dev # API sur 4100
cd front && npm run dev       # site sur 3100
```

Puis, depuis `front/` :

```bash
# Le mot de passe est celui du compte créé par le seed (back/.env)
E2E_ADMIN_PASSWORD='…' npm run test:e2e

npm run test:e2e:ui          # mode interactif, pour mettre au point une suite
npm run test:e2e:rapport     # rapport HTML de la dernière exécution
```

### Variables

| Variable | Défaut | Rôle |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:3100` | adresse du site à tester |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4100/api/v1` | adresse de l'API |
| `E2E_ADMIN_EMAIL` | `admin@1001sadaqa.com` | compte d'administration |
| `E2E_ADMIN_PASSWORD` | *(vide)* | sans lui, les suites du back-office sont ignorées |

## Les suites

| Fichier | Ce qu'il protège |
|---|---|
| `site-public.spec.ts` | les 15 routes répondent, affichent leur contenu, sans erreur console ; le mur de logos charge ; un slug inconnu répond 404 |
| `formulaires-publics.spec.ts` | contact, don, bénévolat, partenariat : validation, confirmation à l'écran, **et arrivée de l'enregistrement dans le back-office** |
| `back-office.spec.ts` | téléverser, créer, modifier, supprimer, publier ; répercussion immédiate sur le site public ; refus d'un fichier obligatoire manquant ou trop lourd |
| `controle-acces.spec.ts` | redirection sans session, refus d'identifiants, cloisonnement des rôles, déconnexion effective |
| `navigation-client.spec.ts` | les listes sont lues par le navigateur, et le jeton ne traîne pas dans le stockage |
| `mobile.spec.ts` | aucun débordement horizontal sur écran de 375 px, cibles tactiles ≥ 24 px (WCAG 2.2 AA) |
| `zz-menage.spec.ts` | retire les enregistrements d'essai — préfixe `zz-` pour passer en dernier |

## Deux pièges rencontrés en les écrivant

**`waitForLoadState('networkidle')` n'aboutit jamais** contre un serveur de
développement : le socket de rechargement à chaud reste ouvert et le réseau ne
se tait pas. Chaque page brûlait deux minutes d'attente inutile. Utiliser
`attendrePage()`, dans `aides.ts`.

**Un motif d'URL non ancré se satisfait de l'URL de départ.**
`waitForURL(/\/admin\/actualites/)` correspond déjà à
`/admin/actualites/<id>` : l'attente se résolvait aussitôt et la page suivante
était lue pendant que l'enregistrement était encore en vol. Ancrer avec
`(\?|$)`.

## Données d'essai

Chaque exécution pose une marque `E2E……` sur ce qu'elle crée, et
`zz-menage.spec.ts` retire ensuite ce qui la porte. Les dons et les demandes de
partenariat n'ont volontairement pas de suppression côté API — on n'efface pas
une trace reçue — et restent donc en base ; à retirer à la main si besoin.

## Lancer contre la version construite, pas le serveur de développement

```bash
cd front && npm run preview          # construit puis sert sur 3100
E2E_ADMIN_PASSWORD='…' npm run test:e2e
```

La suite passe de vingt-huit à **onze minutes**, et surtout elle mesure ce que
verront les visiteurs. Contre le serveur de développement, chaque page est
compilée à la première visite : on chronomètre un outil, pas le site.

### Ce que la vitesse a révélé

En production, la suite enchaîne assez vite les connexions pour déclencher la
**limitation anti-force brute** — cinq tentatives par minute et par adresse.
Un test passait donc uniquement parce que le mode développement était lent.

L'aide `connecter()` patiente et rejoue lorsqu'elle rencontre le message
« Trop de tentatives ». On ne désactive pas le garde-fou pour faire passer un
test : c'est lui qui protège le back-office.

## Une seule exécution à la fois

Playwright écrit ses traces et ses captures dans `front/test-results/`. Deux
`playwright test` lancés en parallèle se détruisent mutuellement ces fichiers,
et les tests échouent sur `browserContext.close: ENOENT` — un échec qui ne dit
rien du code. Attendre la fin d'une exécution avant d'en lancer une autre.

## Ne pas lancer deux serveurs de développement dans ce dossier

Next écrit son cache de compilation dans `front/.next`. Deux `next dev`
démarrés depuis le même dossier — même sur des ports différents — se
disputent ce cache : les fragments JavaScript finissent par répondre 404 et
les pages publiques cassent, avec des erreurs de type MIME en console.

Pour tester une version parallèle, viser les serveurs déjà en marche via
`E2E_BASE_URL`, ou travailler dans une copie du projet ayant son propre
`node_modules`.
