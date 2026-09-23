# Site web institutionnel 1001 SADAQA

Mise en œuvre du cahier des charges *Spécifications fonctionnelles et techniques
v1.0* — Plan directeur 12 semaines, Chantier 3 (Infrastructure digitale).

| Couche | Technologie | Dossier |
|---|---|---|
| Frontend | Next.js 15 (App Router), Tailwind CSS 4, Motion | `front/` |
| Backend | NestJS 11, Prisma 6 | `back/` |
| Base de données | PostgreSQL 16 | `docker-compose.yml` |
| Stockage médias | MinIO (compatible S3) | `docker-compose.yml` |

---

## 1. Démarrer en local

Prérequis : Node.js 20+ et Docker.

```bash
# 1. Base de données et stockage
docker compose up -d

# 2. API
cd back
cp .env.example .env
npm install
npx prisma migrate dev        # crée le schéma
npm run seed                  # contenus initiaux (relançable sans risque)
npm run start:dev             # → http://localhost:4100/api/v1

# 3. Site
cd ../front
cp .env.local.example .env.local
npm install
npm run dev                   # → http://localhost:3100
```

Site : <http://localhost:3100> · Back-office : <http://localhost:3100/admin>

Documentation interactive de l'API : <http://localhost:4100/api/docs>
(hors production uniquement).

### Ports

Décalés par rapport aux valeurs usuelles, 3000/4000/5432/5433 étant déjà
occupés sur le poste de développement d'origine. À ajuster librement dans
`docker-compose.yml`, `back/.env` et `front/package.json`.

| Service | Port |
|---|---|
| Site et back-office | 3100 |
| API | 4100 |
| PostgreSQL | 5434 |
| MinIO (API / console) | 9000 / 9001 |

### En cas de problème au démarrage

**« Port already in use » / `EADDRINUSE`.** Un serveur tourne déjà sur le port.
Pour trouver et arrêter le processus concerné :

```bash
netstat -ano | grep LISTENING | grep ":3100"   # ou 4100
taskkill //PID <le_PID_affiché> //F            # Git Bash sous Windows
# PowerShell : Stop-Process -Id <PID> -Force
```

**Le site met plusieurs minutes à s'afficher.** Normal en mode développement :
`next dev` compile à la demande, et la première compilation prend une à quatre
minutes selon la machine ; les pages suivantes, quelques secondes. Pour un
aperçu rapide, préférez la version compilée :

```bash
cd front && npm run build && npm run start
```

**`Can't reach database server at 127.0.0.1:5434`.** Le conteneur PostgreSQL
n'est pas démarré :

```bash
docker compose up -d
docker ps --filter name=sadaqa      # doit afficher « healthy »
```

L'adresse est volontairement en `127.0.0.1` et non `localhost` : sous Windows,
`localhost` résout d'abord en IPv6 (`::1`), et si un autre processus y écoute,
la connexion part vers lui et échoue.

**Un contenu saisi en base n'apparaît pas sur le site.** Les pages publiques
sont pré-rendues avec une revalidation de 5 minutes. Sur un serveur qui tourne,
le contenu apparaît donc au plus tard 5 minutes après. Mais **au moment d'un
build**, Next peut réutiliser une réponse d'API mise en cache dans `.next` : un
membre d'équipe ajouté juste avant peut manquer à l'appel. Pour forcer :

```bash
cd front && rm -rf .next && npm run build
```

**Impossible de se connecter au back-office / « ERR_TOO_MANY_REDIRECTS ».**
Un jeton de session périmé dans le navigateur. Le cas est désormais traité :
`/admin` renvoie vers `/admin/login?session=expiree`, le middleware purge les
cookies et le formulaire affiche « Votre session a expiré ». Si le problème
persiste, effacez à la main les cookies `sadaqa_at` et `sadaqa_rt` pour
`localhost:3100` — outils de développement, onglet Application, puis Cookies.

**Une page du back-office met 10 à 60 secondes à s'afficher.** Compilation à la
demande du mode développement, au premier accès à chaque route. Les visites
suivantes sont immédiates.

**`Cannot find module '…/back/dist/main'`.** Le cache de compilation est
désynchronisé du dossier de sortie. À réinitialiser :

```bash
cd back && rm -rf dist && npm run start:dev
```

### Compte d'administration

Créé par le seed, à partir de `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD` :
`admin@1001sadaqa.com` / `Sadaqa2026!`. **À changer avant toute mise en ligne**,
de même que `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET`
(`openssl rand -base64 48`).

---

## 2. Ce qui est livré

### Site public — 14 routes

L'arborescence du § 3.3 du cahier des charges. Le site est **en français
uniquement** : voir § 5, écart n° 9.

| Route | Contenu |
|---|---|
| `/` | Accueil : héros, mission, programmes, causes à soutenir, méthode, témoignages, galerie, actualités, projets |
| `/about` | Vision, mission, engagement, trois piliers, équipe & gouvernance (4 membres), Forum Social Mondial 2026 |
| `/programs` · `/programs/[slug]` | Les cinq programmes, et la fiche de chacun avec ses projets rattachés |
| `/projects` · `/projects/[slug]` | Projets filtrables par programme, données d'impact avec mention de vérification |
| `/news` · `/news/[slug]` | Actualités, article à la une, articles liés |
| `/partners` | Espace B2B : formes de partenariat, partenaires, documents téléchargeables, mise en relation |
| `/take-action` | Trois voies d'engagement |
| `/take-action/donate` | Don en quatre étapes avec récapitulatif persistant |
| `/take-action/volunteer` | Missions ouvertes et candidature |
| `/take-action/partner` | Redirige vers `/partners` (voir § 5) |
| `/contact` | Formulaire, coordonnées, WhatsApp Business, carte |
| `/credits` | Crédits et licences des visuels |

Liens courts partageables : `/donate`, `/volunteer`, `/partner`.

### API — 15 modules

Les douze modules du § 4.3.1, plus `campaigns`, `team` et `site`.

- **Lectures publiques** : programmes, projets, actualités, témoignages,
  partenaires, documents, causes, équipe, missions, galerie, paramètres,
  chiffres d'impact.
- **Formulaires publics** : contact, don, candidature bénévole, demande de
  partenariat. Chacun est limité en débit (3 à 6 envois par 5 minutes et par
  adresse IP).
- **Administration** : authentification JWT avec jeton de rafraîchissement,
  gestion des utilisateurs, et opérations d'écriture sur tous les contenus.

Sécurité conforme au § 4.6 : Helmet, CORS restrictif, validation par DTO
(`class-validator`), `@nestjs/throttler`, hachage bcrypt, requêtes paramétrées
par Prisma. Toute route non marquée `@Public()` exige un jeton valide — le
choix par défaut est la fermeture.

### Back-office — 15 écrans

Interface sur mesure dans la même application Next.js, avec la charte du site.
Accès : **/admin** (voir § 1 pour le compte).

| Écran | Contenu |
|---|---|
| `/admin/login` | Connexion. Hors du gabarit authentifié, pour ne pas boucler |
| `/admin` | Tableau de bord : ce qui attend une réponse, dons, volumes |
| `/admin/programmes` · `projets` · `actualites` · `causes` | Contenus principaux |
| `/admin/equipe` · `temoignages` · `partenaires` · `missions` · `documents` | Contenus secondaires |
| `/admin/projets/[id]` | Fiche projet, avec saisie des données d'impact |
| `/admin/demandes` | Messages, bénévoles, partenariats, dons — avec changement de statut |
| `/admin/medias` | Media Library : dépôt, métadonnées de droits, mise en galerie |
| `/admin/parametres` | Paramètres du site, dont la passerelle de paiement |
| `/admin/utilisateurs` | Comptes et rôles |

**Neuf types de contenu, une seule implémentation.** Les écrans de liste, de
création et de modification sont engendrés depuis des descripteurs
(`front/src/lib/admin/resources.ts`) : trois fichiers de page servent les neuf
contenus. Un dixième ne demandera qu'une entrée dans ce fichier. Les
descripteurs sont des données pures — un chemin d'API y est un gabarit
`'/programs/:id'` et non une fonction, sans quoi React refuserait de les
transmettre à un composant client.

**Session.** Les jetons JWT vivent dans des cookies `httpOnly`, hors d'atteinte
d'une injection de script — contrairement à un `localStorage`. Ils ne quittent
jamais le serveur Next, qui les rattache aux appels vers l'API. Le jeton
d'accès expirant au bout de quinze minutes, un premier 401 déclenche un
renouvellement puis un second essai : la saisie n'est pas interrompue.

**Rôles.** Les trois niveaux de validation du § 5.1.2 sont appliqués par l'API
et reflétés par l'interface : une rubrique fermée à un rôle n'apparaît pas dans
la navigation, et le champ « Publier » se présente verrouillé à un
contributeur — plutôt que masqué, pour que la règle soit lisible.

**Publication immédiate.** Les lectures publiques portent des étiquettes de
cache que le back-office invalide après enregistrement. Sans cela, une
modification n'apparaîtrait qu'au bout des cinq minutes de revalidation, et
l'équipe conclurait que l'enregistrement a échoué.

### Base de données

Le schéma de l'annexe 7.1 à l'identique, plus sept entités qu'exigent les
blocs des maquettes et qui seraient sinon codées en dur, donc non éditables :

| Entité | Bloc concerné |
|---|---|
| `Campaign` | « Causes à soutenir » (accueil, barres de progression) |
| `TeamMember` | « Équipe & gouvernance » (`/about`) |
| `VolunteerMission` | « Missions ouvertes » (`/take-action/volunteer`) |
| `PartnerDocument` | « Documents à télécharger » (`/partners`) |
| `PartnershipRequest` | Formulaire de mise en relation B2B |
| `MediaAsset` | Media Library et traçabilité du droit à l'image |
| `Setting` | Paramètres du site, dont la passerelle de paiement |

### Droit à l'image

Le point de vigilance du § 4.5 est traité comme un contrôle serveur, pas comme
une case à cocher. `MediaAsset` trace la nature de l'autorisation, sa portée
(web, presse, réseaux sociaux, imprimé), sa durée, le signataire et sa qualité
de représentant légal. `media.service.ts → assertPublishable` refuse la mise en
galerie d'un média dont le consentement est absent, ne couvre pas l'usage web
ou a expiré — la réponse est un `422`, y compris si l'interface demande la
publication.

---

## 3. Parti pris visuel

Palette et typographie relevées sur les maquettes de `Design/export` :

| Rôle | Valeur |
|---|---|
| Vert profond (bandeau, sections sombres) | `#0B2E15` |
| Vert du pied de page | `#081F0F` |
| Or (accent, appels à l'action) | `#F5B324` |
| Sable (blocs média) | `#E7E3D7` |
| Crème (bandeau bénévolat) | `#FCE7BA` |
| Vert feuille (étiquettes) | `#3B7A3F` |

Titres en **Outfit**, texte courant en **Plus Jakarta Sans** — deux familles
géométriques et chaleureuses, proches du dessin des maquettes.

Les exports 06, 07 et 08 ont été capturés en cours d'animation : leurs titres
apparaissent à demi-opacité. C'est ce qui a confirmé les révélations au
défilement, reprises et étendues ici.

### Mouvement

Un seul jeu de courbes pour tout le site (`components/motion/motion-config.ts`),
ce qui évite l'effet d'assemblage d'effets disparates :

- révélation des blocs à l'entrée dans le champ de vision, en cascade ;
- grands titres révélés ligne par ligne derrière un masque, le point de césure
  étant choisi dans le fichier de traduction au moyen d'une barre verticale ;
- boutons attirés par le curseur au pointeur fin, et enfoncés au ressort au
  toucher — c'est ce retour immédiat qui rend le site réactif sur mobile ;
- héros à photographie assombrie, halo suivant le curseur, recul au défilement ;
- compteurs de chiffres d'impact et barres de collecte animés à l'apparition ;
- bande défilante « De l'assistance à l'autonomie », en CSS pur ;
- galerie avec visionneuse plein écran, navigable au clavier et au glissement.

Trois garde-fous, parce qu'une animation d'apparition qui ne se déclenche pas
laisse une page blanche :

- `prefers-reduced-motion` est respecté en CSS comme en JavaScript ;
- un bloc `noscript` neutralise les états initiaux, pour que le contenu reste
  visible sans JavaScript au lieu de rester à opacité zéro ;
- au montage, un bloc déjà visible ou déjà dépassé s'affiche sans attendre
  d'entrer dans le champ. Sans cela, un visiteur qui défile avant la fin de
  l'hydratation pouvait dépasser une section : elle n'entrait jamais dans le
  champ et restait vide jusqu'à ce qu'il remonte.

---

## 4. Vérifications effectuées

| Contrôle | Résultat |
|---|---|
| Compilation TypeScript, API et site | sans erreur |
| Migration + seed, relancé deux fois | idempotent |
| 43 appels API (lectures, écritures, rôles, validation) | conformes |
| Refus de publication d'un média sans consentement | `422` |
| Clé secrète de paiement exposée par l'API | non |
| 24 routes du site (canoniques, redirections, 404) | conformes |
| 15 écrans du back-office | conformes |
| Garde du back-office sans session | redirection vers /admin/login |
| Parcours back-office : connexion, édition, enregistrement | contenu écrit en base |
| Connexion avec un jeton périmé | cookies purgés, formulaire atteignable |
| Retour à la page demandée après connexion | conforme |
| Visite de /admin/login en étant connecté | session conservée |
| Répercussion d'une modification sur le site public | immédiate |
| Erreurs console, accueil et pages internes | aucune |
| Images cassées | aucune |
| Débordement horizontal, de 390 à 1440 px | aucun |
| Blocs restés masqués après parcours complet | aucun (83 blocs animés) |
| Formulaire bénévole, partenariat, don, de bout en bout | enregistrés en base |
| JavaScript de premier chargement | 153 à 166 ko (budget : 200 ko) |
| Démarrage de l'API sans stockage joignable | dégradation propre, avertissement journalisé |

**Non exercé :** l'envoi de médias vers MinIO. Le stock initial de visuels est
servi par `front/public/`, et la Media Library relève du back-office, qui reste
à construire. Le service de stockage crée ses buckets au démarrage et
n'empêche pas l'API de fonctionner s'il est injoignable — c'est ce dernier
comportement qui a été vérifié, pas le téléversement lui-même.

---

## 5. Écarts assumés par rapport aux maquettes

Chacun est un choix, pas un oubli.

1. **Chiffres d'impact dérivés de la base.** Les maquettes affichent « 12 projets
   menés » et « 7 domaines d'action ». Le site compte ce qui existe réellement :
   6 projets et 5 programmes. Un site qui annonce des chiffres qu'il ne peut pas
   justifier perd exactement la crédibilité que le cahier des charges lui demande
   de construire. Les deux valeurs non dérivables — personnes aidées, communes
   couvertes — sont réglables en back-office.

2. **Témoignages fictifs, en attendant les vrais.** Les trois témoignages
   (bénéficiaire, bénévole, partenaire) sont inventés et signalés comme tels
   dans `back/prisma/seed.ts`. Ils tiennent la place jusqu'à ce que le SADAQA
   Media Engine rapporte de vraies paroles — **à remplacer avant la mise en
   ligne**.

   Le témoignage « partenaire » cite volontairement une organisation
   inexistante : prêter des propos inventés à Dangote Salt, Sothema, Ajanta
   Pharma ou aux Ateliers Greenlab engagerait l'association auprès
   d'entreprises réelles.

3. **Champ e-mail ajouté au formulaire bénévole.** La maquette 08 ne le prévoit
   pas, mais le modèle de données le rend obligatoire et c'est le seul moyen
   fiable de répondre à une candidature.

4. **Moyen de paiement sélectionnable sur la page de don.** La maquette le
   présente en information ; l'API exige un moyen. Les options proposées sont
   celles activées en back-office.

5. **`/take-action/partner` redirige vers `/partners`.** L'espace partenaires
   porte déjà les formes de partenariat, les documents et le formulaire.
   Dupliquer le formulaire à deux adresses aurait dédoublé le suivi des
   demandes.

6. **Bandeau de partenaires ajouté à l'espace partenaires.** Les maquettes n'en
   prévoyaient pas ; quatre logos ayant été fournis (Dangote Salt, Sothema,
   Ajanta Pharma, Les Ateliers Greenlab), la section « Ils nous accompagnent »
   a été créée.

   Les fichiers sont normalisés en amont sur un gabarit commun de 900 × 360 où
   chaque logo occupe la **même aire** — sans quoi le badge carré de Dangote
   paraissait trois fois plus petit que les logotypes larges à hauteur égale.
   Le fond noir du logo Greenlab a été rendu transparent. Les adresses de site
   sont volontairement vides plutôt que devinées : à renseigner en back-office.

7. **Section « Media Library » retirée de la page actualités.** Le modèle
   `MediaAsset`, le contrôle de consentement et la galerie publique restent en
   place ; c'est seulement le bloc d'appel à demande d'accès qui a été retiré
   du site public.

8. **Carte OpenStreetMap plutôt qu'un bloc d'attente.** Sans clé d'API ni
   traceur tiers, et chargée en différé.

9. **Site en français uniquement, traduction laissée au navigateur.** Le
   cahier des charges prévoit next-intl (§ 4.1) et un routage par locale
   fr/en (§ 3.3). Décision prise en cours de réalisation : s'appuyer sur la
   traduction automatique du navigateur du visiteur.

   La raison technique est déterminante. Un navigateur ne propose de traduire
   que si l'attribut `lang` de la page diffère de la langue du lecteur. Une
   version `/en` déclarant `lang="en"` alors que ses contenus éditoriaux
   restent en français — cas inévitable tant que la base n'a pas de colonne de
   langue — aurait été le seul endroit du site où la traduction automatique ne
   se serait pas déclenchée. Un anglophone y serait resté bloqué sur du
   français non traduit.

   Toutes les pages déclarent donc `lang="fr"`, et la traduction est proposée
   partout. Conséquences : next-intl, la route `/en` et le sélecteur de langue
   ont été retirés ; le middleware de détection disparaît, soit environ 46 ko
   de JavaScript en moins ; les libellés restent regroupés dans
   `front/messages/fr.json`, lus par `front/src/lib/text.ts`.

   Pour revenir à un vrai bilingue, il faudra réintroduire next-intl **et**
   traduire les contenus en base — les deux vont ensemble.

---

## 6. Reste à faire

### Bloquant pour la mise en ligne

- **Remplacer les visuels.** Les photographies actuelles proviennent de
  Wikimedia Commons et sont sous licence libre, mais **ne représentent pas des
  bénéficiaires de 1001 SADAQA**. Les laisser en production laisserait entendre
  le contraire. Voir `front/public/images/CREDITS.md` : chaque emplacement
  s'écrase en déposant un fichier de même nom, sans toucher au code. La page
  `/credits` satisfait l'obligation d'attribution des licences CC BY et CC BY-SA
  tant que ces visuels sont en ligne.
- **Recueillir les témoignages et les documents partenaires.** Les quatre PDF de
  `front/public/documents/` sont des substituts qui annoncent leur propre
  nature.
- **Changer les secrets** : mot de passe administrateur et clés JWT.

### Limites connues du back-office

Le back-office est livré et fonctionnel (§ 2). Ce qu'il ne fait pas, en toute
transparence :

- **Pas d'éditeur de texte enrichi.** Les contenus longs se saisissent en
  texte, les paragraphes étant séparés par une ligne vide. C'est délibéré :
  rien n'est interprété comme du HTML, donc aucune injection possible depuis
  l'interface. En contrepartie, ni gras, ni listes, ni liens dans le corps
  d'un article.
- **Pas de téléversement depuis les formulaires de contenu.** On y saisit un
  chemin (`/images/programs/…`), avec aperçu immédiat pour détecter une faute
  de frappe. Le téléversement réel passe par la Media Library, donc par MinIO.
- **Pas de pagination sur les listes d'administration.** Suffisant aux volumes
  actuels ; à ajouter au-delà d'une soixantaine d'éléments par type.
- **Pas de réinitialisation de mot de passe par courriel** : aucun service
  d'envoi n'est configuré. Un administrateur redéfinit le mot de passe depuis
  l'écran Utilisateurs.
- **Pas de journal des modifications.** On ne sait pas qui a changé quoi ni
  quand. À prévoir si plusieurs personnes éditent en parallèle.

### Passerelle de paiement

Le module `settings` porte la configuration : fournisseur, clés, mode test,
moyens activés, instructions de règlement. Tant que `payment.enabled` est à
`false`, le don est enregistré en statut `PENDING` et le donateur reçoit les
instructions de règlement ; le suivi se fait en back-office. L'activer demande
de renseigner les clés et d'implémenter l'appel au fournisseur (KKiaPay ou
FedaPay) dans `donations.service.ts`, là où le mode `online` est déjà distingué.

Aucune route publique de confirmation de don n'a été créée volontairement :
sans vérification de signature du fournisseur, un appel anonyme pourrait
marquer n'importe quel don comme encaissé.

### Autres points du cahier des charges non couverts

- **Sentry** : la variable `SENTRY_DSN` est prévue, l'initialisation reste à
  faire.
- **Google Analytics 4** : la clé `analytics.ga4Id` existe en paramètres, le
  script n'est pas posé — à cadrer avec les obligations d'information des
  visiteurs.
- **CRM** : les demandes entrantes sont stockées en base et lisibles par l'API ;
  la synchronisation vers HubSpot n'est pas faite.
- **CI/CD GitHub Actions** : à écrire.
- **Accessibilité WCAG 2.1 AA** : les fondations sont là — repères de navigation,
  liens d'évitement, libellés de formulaires, `aria-*` sur les composants
  interactifs, focus visible, mouvement réductible. Un audit contrasté et un
  passage au lecteur d'écran restent nécessaires pour l'affirmer.

---

## 7. Note de déploiement importante

Les formulaires passent par les Server Actions de Next.js, qui appellent l'API
côté serveur. L'adresse du visiteur est retransmise dans l'en-tête
`x-forwarded-for`, et l'API est configurée pour la lire (`trust proxy`). Sans
cela, la limitation de débit compterait tous les visiteurs comme un seul client
et bloquerait les formulaires après trois envois.

**Conséquence : l'API ne doit être joignable que par le serveur Next** — réseau
privé ou pare-feu. Exposée publiquement, cet en-tête devient falsifiable et la
limitation de débit contournable.
