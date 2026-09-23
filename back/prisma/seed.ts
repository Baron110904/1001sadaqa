/**
 * Stock initial de contenus.
 *
 * Les textes et les chiffres reprennent les maquettes du dossier
 * `Design/export`. Les témoignages sont fictifs et signalés comme tels à
 * l'endroit où ils sont définis : ils tiennent la place en attendant les
 * paroles recueillies par le SADAQA Media Engine.
 *
 * Le seed est idempotent : il peut être relancé sans dupliquer les contenus.
 */
import {
  ConsentKind,
  ConsentScope,
  ConsentStatus,
  DonationFrequency,
  DonationMethod,
  EventKind,
  MediaBucket,
  MissionKind,
  NewsCategory,
  PartnerType,
  PrismaClient,
  ProjectStatus,
  Recurrence,
  Role,
  TestimonialType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_SETTINGS } from '../src/modules/settings/settings.constants';
import { seedDemo } from './demo';

const prisma = new PrismaClient();

/**
 * Les quatre domaines d’intervention (§4.3 du guide, §1 du dossier
 * institutionnel), avec les ODD auxquels chacun contribue (§5.7).
 */
const DOMAINS = [
  {
    slug: 'protection-sociale',
    name: 'Protection sociale',
    description:
      'Protéger les personnes confrontées à des situations particulières de vulnérabilité : enfants, personnes âgées, mères et bébés.',
    icon: 'shield',
    sdgs: [1, 3, 4, 10],
    order: 1,
  },
  {
    slug: 'securite-alimentaire',
    name: 'Sécurité et aide alimentaires',
    description:
      'Lutter contre la faim tout en développant des mécanismes structurés de solidarité alimentaire : repas, paniers, cantines, récupération des surplus.',
    icon: 'wheat',
    sdgs: [1, 2, 3],
    order: 2,
  },
  {
    slug: 'sante-wash',
    name: 'Santé communautaire & WASH',
    description:
      'Améliorer l’accès à la prévention, à la santé communautaire, à l’eau potable, à l’hygiène et à l’assainissement.',
    icon: 'heart-pulse',
    sdgs: [3, 6],
    order: 3,
  },
  {
    slug: 'autonomisation',
    name: 'Autonomisation économique',
    description:
      'Permettre aux personnes vulnérables, notamment aux femmes, de développer leurs capacités économiques et leur autonomie.',
    icon: 'sprout',
    sdgs: [5, 8, 10],
    order: 4,
  },
];

/**
 * Les huit programmes structurants.
 *
 * Les rubriques reprennent le dossier institutionnel 2026, qui décrit chaque
 * programme en « Le défi / Notre réponse / Notre impact ». Les rubriques que le
 * dossier ne documente pas restent vides : le guide prévoit qu’une rubrique
 * vide ne s’affiche pas (§4.4), et rien n’est inventé ici.
 */
const PROGRAMS = [
  {
    slug: 'orphan-care',
    domainSlug: 'protection-sociale',
    title: '1001 Orphelins',
    shortLabel: 'Orphelins',
    description: 'Protection et accompagnement des enfants vulnérables.',
    icon: 'baby',
    image: '/images/programs/enfance-aines.jpg',
    context:
      'De nombreux enfants vulnérables grandissent dans des conditions fragiles, avec un accès limité à l’éducation, aux soins, à la nutrition et à un environnement protecteur.',
    objectives:
      'Accompagner progressivement vingt structures d’accueil partenaires, objectif pilote du projet Orphan Care.',
    audience:
      'Orphelins et enfants vulnérables, ainsi que les structures d’accueil qui les prennent en charge.',
    activities: [
      'Soutien nutritionnel et alimentaire',
      'Accès aux soins de santé',
      'Accompagnement scolaire et éducatif',
      'Suivi social individualisé',
      'Accompagnement des structures partenaires accueillant des enfants vulnérables',
    ],
    outcomes:
      'Des enfants mieux protégés, en meilleure santé, scolarisés et accompagnés pour construire leur avenir.',
    order: 1,
  },
  {
    slug: 'seniors-care',
    image: '/images/programs/seniors-care.jpg',
    domainSlug: 'protection-sociale',
    title: '1001 Seniors',
    shortLabel: 'Seniors',
    description: 'Préserver la dignité des personnes âgées.',
    icon: 'users',
    context:
      'Les personnes âgées vulnérables sont souvent confrontées à l’isolement social, aux difficultés économiques et à un accès limité aux soins.',
    audience: 'Personnes âgées en situation de vulnérabilité ou d’isolement.',
    activities: [
      'Soutien alimentaire',
      'Accompagnement social',
      'Accès aux soins essentiels',
      'Visites communautaires',
      'Maintien du lien social et valorisation de leur place dans la communauté',
    ],
    outcomes:
      'Des personnes âgées accompagnées, respectées et maintenues dans un environnement plus digne et solidaire.',
    order: 2,
  },
  {
    slug: 'mother-baby-care',
    image: '/images/programs/mother-baby-care.jpg',
    domainSlug: 'protection-sociale',
    title: 'Mother & Baby Care',
    shortLabel: 'Mère & enfant',
    description: 'Santé et nutrition de la mère et de l’enfant.',
    icon: 'heart',
    context:
      'De nombreuses femmes enceintes, jeunes mamans et enfants de moins de cinq ans restent exposés à la malnutrition, aux maladies évitables et à un accès insuffisant aux soins.',
    audience: 'Femmes enceintes, jeunes mères allaitantes et enfants de moins de cinq ans.',
    activities: [
      'Suivi de la grossesse et orientation vers les soins prénataux',
      'Soutien nutritionnel des femmes enceintes et allaitantes',
      'Promotion de l’allaitement maternel',
      'Suivi de la croissance et du développement de l’enfant',
      'Prévention des maladies évitables et sensibilisation familiale',
      'Distribution de kits nutritionnels et d’hygiène selon les besoins',
    ],
    outcomes:
      'Des mères mieux accompagnées, des enfants en meilleure santé et des familles renforcées pour offrir à chaque enfant un bon départ dans la vie.',
    order: 3,
  },
  {
    slug: 'programme-alimentaire',
    domainSlug: 'securite-alimentaire',
    title: 'Programmes alimentaires solidaires',
    shortLabel: 'Alimentaire',
    description:
      'Repas, paniers et cantines solidaires au bénéfice des familles et des personnes en difficulté.',
    icon: 'utensils',
    image: '/images/programs/securite-alimentaire.jpg',
    context:
      'L’insécurité alimentaire fragilise les familles, réduit les opportunités éducatives des enfants et augmente la vulnérabilité des personnes déjà précaires.',
    audience:
      'Familles vulnérables, enfants et personnes en difficulté accueillis dans les hôpitaux et structures sociales partenaires.',
    activities: [
      '1001 Paniers : distribution de colis alimentaires aux familles vulnérables',
      '1001 Iftar : distribution de repas pendant le mois de Ramadan',
      '1001 Repas Solidaires : actions alimentaires régulières au bénéfice des personnes en difficulté',
      'Cantines Solidaires : soutien à l’alimentation régulière des enfants et des personnes vulnérables au sein des hôpitaux et structures sociales partenaires',
      'Tabaski Solidaire : collecte et distribution de viande aux familles vulnérables',
      'Actions nutritionnelles ciblées : accompagnement adapté aux enfants, aux femmes enceintes, aux mères allaitantes et aux personnes âgées',
    ],
    outcomes:
      'Une amélioration de l’accès à une alimentation suffisante, nutritive et digne, un soutien renforcé aux familles vulnérables et une réduction progressive du gaspillage alimentaire.',
    order: 4,
  },
  {
    slug: 'banque-alimentaire',
    image: '/images/programs/banque-alimentaire.jpg',
    domainSlug: 'securite-alimentaire',
    title: 'Banque Alimentaire 1001 SADAQA',
    shortLabel: 'Banque alimentaire',
    description:
      'Dispositif permanent de collecte, de stockage et de redistribution des denrées. Projet en cours de développement.',
    icon: 'warehouse',
    context:
      'Les dons et surplus alimentaires se perdent faute d’un dispositif permanent capable de les collecter, de les contrôler et de les redistribuer aux familles et aux structures sociales.',
    objectives:
      'Mettre en place un dispositif permanent de collecte des dons et surplus alimentaires, de stockage, de contrôle et de redistribution au profit des familles et structures sociales partenaires.',
    activities: [
      'Collecte des dons et des surplus alimentaires',
      'Stockage et contrôle des denrées',
      'Redistribution aux familles et aux structures sociales partenaires',
      'Lutte contre le gaspillage alimentaire',
      'Traçabilité des dons reçus et redistribués',
    ],
    outcomes:
      'Le développement d’un mécanisme durable de solidarité alimentaire, au service des familles vulnérables et des structures partenaires.',
    order: 5,
  },
  {
    slug: 'community-health',
    domainSlug: 'sante-wash',
    title: 'Santé communautaire',
    shortLabel: 'Santé',
    description: 'Accès aux soins et prévention au plus près des populations.',
    icon: 'stethoscope',
    image: '/images/programs/sante-prevention.jpg',
    context:
      'Les populations vulnérables rencontrent encore des obstacles importants pour accéder aux soins : coût des consultations, manque d’information, retard de diagnostic et difficultés d’accès aux médicaments essentiels.',
    audience:
      'Populations vulnérables éloignées des services de santé, à Cotonou et dans les communes d’intervention.',
    activities: [
      'Dépistage et prévention des maladies',
      'Consultations médicales solidaires',
      'Campagnes de vaccination',
      'Distribution de médicaments essentiels selon les besoins identifiés',
      'Sensibilisation à la santé et à l’hygiène',
      'Actions de santé bucco-dentaire et de soutien psychosocial',
    ],
    outcomes:
      'Des communautés mieux informées, des maladies détectées plus précocement et un accès renforcé aux services de santé essentiels.',
    order: 6,
  },
  {
    slug: 'wash',
    domainSlug: 'sante-wash',
    title: 'WASH — Eau, hygiène et assainissement',
    shortLabel: 'WASH',
    description: 'Accès à l’eau potable, hygiène et assainissement pour les communautés.',
    icon: 'droplets',
    image: '/images/programs/eau-hygiene.jpg',
    context:
      'L’accès insuffisant à l’eau potable et aux infrastructures d’assainissement contribue à la propagation des maladies et fragilise les conditions de vie des communautés.',
    audience: 'Communautés rurales et quartiers privés d’accès à une eau potable sûre.',
    activities: [
      'Construire et réhabiliter des points d’eau',
      'Installer des solutions adaptées comme les pompes solaires',
      'Promouvoir les pratiques d’hygiène',
      'Soutenir les campagnes communautaires de salubrité',
    ],
    outcomes:
      'Un meilleur accès à l’eau potable, une réduction des maladies hydriques et des communautés plus résilientes.',
    order: 7,
  },
  {
    slug: 'empowerment',
    domainSlug: 'autonomisation',
    title: 'Empowerment — Accompagner vers l’autonomie',
    shortLabel: 'Autonomie',
    description: 'Autonomisation économique des femmes et des jeunes en situation de précarité.',
    icon: 'trending-up',
    image: '/images/programs/education-autonomisation.jpg',
    context:
      'La dépendance à l’aide ponctuelle limite la capacité des familles vulnérables, notamment des femmes et des jeunes, à construire un avenir stable.',
    objectives: 'Permettre une sortie durable de la pauvreté.',
    audience: 'Femmes et jeunes en situation de précarité.',
    activities: [
      'Identification des capacités et des besoins',
      'Formations professionnelles et entrepreneuriales',
      'Éducation financière',
      'Accompagnement personnalisé',
      'Dotation en outils ou kits de démarrage',
      'Mentorat et mise en réseau',
    ],
    outcomes:
      'Des bénéficiaires capables de développer une activité économique, d’améliorer leurs revenus et de devenir acteurs de leur propre développement.',
    order: 8,
  },
];

const PROJECTS = [
  {
    slug: 'paniers-solidaires',
    programSlug: 'programme-alimentaire',
    title: 'Paniers solidaires',
    description: 'Distribution hebdomadaire de denrées aux familles les plus exposées.',
    content:
      "Chaque samedi, les bénévoles composent et distribuent des paniers de denrées de base — riz, huile, tomate, savon — aux ménages identifiés avec les relais de quartier. La composition du panier est révisée chaque trimestre selon les prix du marché de Dantokpa.",
    status: ProjectStatus.EN_COURS,
    isPublished: true,
    location: 'Fidjrossè, Cotonou',
    startDate: '2025-03-01',
    image: '/images/projects/paniers-solidaires.jpg',
    order: 1,
    impacts: [
      { indicator: 'familles servies', value: '400', isPrimary: true, verified: true },
      { indicator: 'paniers distribués', value: '3 200', verified: true },
    ],
  },
  {
    slug: 'rentree-scolaire-equipee',
    programSlug: 'orphan-care',
    title: 'Rentrée scolaire équipée',
    description: "Kits scolaires et prise en charge des frais d'inscription.",
    content:
      "Avant chaque rentrée, l'association prend en charge les frais d'inscription et fournit un kit complet — cahiers, fournitures, tenue — aux enfants des familles suivies. Le suivi ne s'arrête pas à la distribution : les bulletins sont relevés à chaque trimestre.",
    status: ProjectStatus.REALISE,
    isPublished: true,
    location: 'Cotonou',
    startDate: '2025-08-15',
    endDate: '2025-10-10',
    image: '/images/projects/rentree-scolaire.jpg',
    order: 2,
    impacts: [
      { indicator: 'élèves équipés', value: '180', isPrimary: true, verified: true },
      { indicator: "frais d'inscription pris en charge", value: '96', verified: true },
    ],
  },
  {
    slug: 'point-eau-communautaire',
    programSlug: 'wash',
    title: "Point d'eau communautaire",
    description: "Un forage et un comité de gestion local à Fidjrossè.",
    content:
      "Forage, pompe, aire de puisage et comité de gestion : le projet livre un service, pas seulement un ouvrage. Huit membres du quartier ont été formés à l'entretien courant et un fonds de maintenance a été constitué dès la mise en service.",
    status: ProjectStatus.EN_COURS,
    isPublished: true,
    location: 'Fidjrossè, Cotonou',
    startDate: '2025-06-01',
    image: '/images/projects/point-eau.jpg',
    order: 3,
    impacts: [
      { indicator: 'forage en service', value: '1', isPrimary: true, verified: true },
      { indicator: 'personnes desservies', value: '520' },
    ],
  },
  {
    slug: 'consultations-foraines',
    programSlug: 'community-health',
    title: 'Consultations foraines',
    description: 'Deux journées de consultation gratuite et orientation médicale.',
    content:
      "Deux journées de consultation ouvertes à tous, tenues avec des médecins et infirmiers bénévoles. Les cas nécessitant un plateau technique ont été orientés vers les structures publiques, avec un accompagnement de l'association dans les démarches.",
    status: ProjectStatus.REALISE,
    isPublished: true,
    location: 'Cotonou',
    startDate: '2025-05-17',
    endDate: '2025-05-18',
    image: '/images/projects/consultations-foraines.jpg',
    order: 4,
    impacts: [
      { indicator: 'patients reçus', value: '260', isPrimary: true, verified: true },
      { indicator: 'orientations vers un hôpital', value: '31', verified: true },
    ],
  },
  {
    slug: 'accompagnement-orphelins',
    programSlug: 'orphan-care',
    title: 'Accompagnement des orphelins',
    description: 'Suivi scolaire, soutien alimentaire et accompagnement psychosocial.',
    content:
      "Un suivi individuel, tenu dans la durée : scolarité, alimentation, santé et écoute. Chaque enfant est rattaché à un référent bénévole qui reste le même d'une année sur l'autre — c'est la condition de la confiance.",
    status: ProjectStatus.EN_COURS,
    isPublished: true,
    location: 'Cotonou',
    startDate: '2024-11-01',
    image: '/images/projects/accompagnement-orphelins.jpg',
    order: 5,
    impacts: [{ indicator: 'enfants suivis', value: '45', isPrimary: true, verified: true }],
  },
  {
    slug: 'visites-personnes-agees',
    programSlug: 'seniors-care',
    title: 'Visites aux personnes âgées',
    description: 'Visites à domicile, courses et accompagnement administratif.',
    content:
      "Pour beaucoup d'aînés isolés, la difficulté n'est pas seulement matérielle : c'est l'absence de visite. Les bénévoles passent chaque semaine, font les courses, aident aux démarches et signalent toute dégradation de l'état de santé.",
    status: ProjectStatus.EN_COURS,
    isPublished: true,
    location: 'Cotonou',
    startDate: '2025-01-15',
    image: '/images/projects/visites-aines.jpg',
    order: 6,
    impacts: [{ indicator: 'aînés visités', value: '30', isPrimary: true, verified: true }],
  },
];

const CAMPAIGNS = [
  {
    slug: 'repas-quotidiens-40-enfants',
    title: 'Repas quotidiens pour 40 enfants',
    claim: 'Assurer un repas complet chaque jour de classe pendant un trimestre.',
    goal: 1_000_000,
    raised: 720_000,
    programSlug: 'programme-alimentaire',
    image: '/images/campaigns/cantine.jpg',
    isUrgent: true,
    order: 1,
  },
  {
    slug: 'point-eau-quartier',
    title: "Un point d'eau pour un quartier",
    claim: "Forage, équipement et formation d'un comité de gestion local.",
    goal: 3_000_000,
    raised: 1_350_000,
    programSlug: 'wash',
    image: '/images/campaigns/forage.jpg',
    isUrgent: true,
    order: 2,
  },
  {
    slug: 'kits-scolaires-rentree',
    title: 'Kits scolaires de la rentrée',
    claim: "Fournitures et frais d'inscription pour 180 élèves.",
    goal: 2_000_000,
    raised: 1_760_000,
    programSlug: 'orphan-care',
    image: '/images/campaigns/kits-scolaires.jpg',
    isUrgent: true,
    order: 3,
  },
];

const NEWS = [
  {
    slug: 'forum-social-mondial-cotonou-2026',
    title: '1001 SADAQA sera au Forum Social Mondial de Cotonou',
    category: NewsCategory.COMMUNIQUE,
    publishedAt: '2026-01-12',
    isFeatured: true,
    image: '/images/news/fsm-cotonou.jpg',
    excerpt:
      "Du 4 au 8 août 2026, l'association présentera ses actions de solidarité et de développement social, et cherchera de nouveaux partenariats nationaux et internationaux.",
    content:
      "Le Forum Social Mondial réunit des organisations de la société civile, des mouvements sociaux, des associations et des réseaux engagés dans la construction d'alternatives face aux inégalités et à l'exclusion sociale. L'édition 2026 se tient à Cotonou du 4 au 8 août.\n\n1001 SADAQA y poursuit quatre objectifs : présenter ses actions de solidarité et de développement social, partager son expérience de terrain, renforcer ses capacités institutionnelles, et développer des partenariats avec des organisations nationales et internationales engagées dans la lutte contre la pauvreté, les inégalités et l'exclusion sociale.",
  },
  {
    slug: 'bilan-campagne-rentree-scolaire',
    title: 'Bilan de la campagne de rentrée scolaire',
    category: NewsCategory.COMMUNIQUE,
    publishedAt: '2026-01-03',
    image: '/images/news/bilan-rentree.jpg',
    excerpt:
      "180 élèves équipés et 96 inscriptions prises en charge : le point sur la campagne et sur ce qu'elle a coûté.",
    content:
      "La campagne de rentrée 2025 s'est achevée en octobre. 180 enfants ont reçu un kit scolaire complet et 96 inscriptions ont été prises en charge, pour un budget de 1 760 000 F CFA couvert par les dons ponctuels et deux appuis d'entreprises locales.\n\nCe que nous retenons pour 2026 : anticiper les commandes de fournitures de six semaines, et rattacher chaque enfant équipé au suivi scolaire trimestriel — un tiers seulement l'était cette année.",
  },
  {
    slug: 'ouverture-programme-wash-fidjrosse',
    title: 'Ouverture du programme WASH à Fidjrossè',
    category: NewsCategory.TERRAIN,
    publishedAt: '2025-12-18',
    image: '/images/news/wash-fidjrosse.jpg',
    excerpt:
      "Le premier point d'eau communautaire est en service, avec son comité de gestion et son fonds de maintenance.",
    content:
      "Le forage de Fidjrossè est entré en service en décembre. Huit habitants du quartier ont été formés à l'entretien courant de la pompe et le comité de gestion a ouvert un fonds de maintenance alimenté par une participation symbolique des usagers.\n\nCette organisation n'est pas un détail administratif : c'est ce qui décide si l'ouvrage fonctionnera encore dans trois ans.",
  },
  {
    slug: 'convention-mecenat-competences',
    title: "Signature d'une convention de mécénat de compétences",
    category: NewsCategory.PARTENARIAT,
    publishedAt: '2025-12-02',
    image: '/images/news/convention-mecenat.jpg',
    excerpt:
      "Une convention encadre l'accompagnement en UX/UI, développement et hébergement de l'écosystème digital de l'association.",
    content:
      "L'association a signé une convention de mécénat de compétences portant sur la conception et le développement de son écosystème digital : conception d'interface, développement, hébergement et formation de l'équipe à l'administration des outils.\n\nLa convention prévoit explicitement le transfert : documentation, formation et autonomie éditoriale complète à la livraison.",
  },
  {
    slug: 'journees-consultation-medicale-gratuite',
    title: 'Deux journées de consultation médicale gratuite',
    category: NewsCategory.TERRAIN,
    publishedAt: '2025-11-14',
    image: '/images/news/consultations-medicales.jpg',
    excerpt:
      '260 patients reçus, 31 orientations vers une structure hospitalière, avec des médecins et infirmiers bénévoles.',
    content:
      "Les 17 et 18 mai, deux journées de consultation ouvertes à tous ont permis de recevoir 260 patients. 31 cas nécessitant un plateau technique ont été orientés vers les structures publiques, avec un accompagnement de l'association dans les démarches.\n\nLes motifs de consultation les plus fréquents restent le paludisme, les affections respiratoires et les suivis de grossesse.",
  },
  {
    slug: 'renforcement-gouvernance-interne',
    title: "L'association renforce sa gouvernance interne",
    category: NewsCategory.INSTITUTION,
    publishedAt: '2025-10-28',
    image: '/images/news/gouvernance.jpg',
    excerpt:
      'Mise en place de trois niveaux de validation des contenus et des engagements, et formalisation du suivi des données d’impact.',
    content:
      "Le conseil a arrêté une organisation en trois niveaux de validation : les contenus courants relèvent de l'équipe éditoriale, les contenus institutionnels de l'administration, et les données d'impact comme les positions publiques de la direction.\n\nCe cadre répond à une exigence simple : ce que l'association publie sur son impact doit être vérifiable.",
  },
  {
    slug: 'distribution-alimentaire-retour-en-images',
    title: 'Distribution alimentaire : retour en images',
    category: NewsCategory.TERRAIN,
    publishedAt: '2025-10-09',
    image: '/images/news/distribution-images.jpg',
    excerpt:
      'Une matinée de distribution, du chargement des denrées à la remise des paniers aux familles.',
    content:
      "Retour en images sur une matinée de distribution : réception et pesée des denrées, composition des paniers, accueil des familles et remise. Douze bénévoles étaient mobilisés.\n\nLes visuels de cette série sont versés à la Media Library de l'association, avec les autorisations d'utilisation correspondantes.",
  },
];

/**
 * Événements réalisés.
 *
 * La récurrence relie les éditions successives : 1001 Iftar et Tabaski
 * solidaire reviennent chaque année, et ce sont précisément les périodes où le
 * site change d’aspect (§2.6). Un visiteur arrivant sur la campagne en cours
 * retrouve ainsi l’historique des éditions précédentes.
 */
const EVENTS = [
  {
    slug: 'iftar-2026',
    image: '/images/terrain/repas-iftar.jpg',
    programSlug: 'programme-alimentaire',
    title: '1001 Iftar — Ramadan solidaire 2026',
    startDate: '2026-02-18',
    endDate: '2026-03-19',
    location: 'Cotonou et communes environnantes',
    kind: 'DISTRIBUTION',
    description:
      'Distribution quotidienne de repas de rupture du jeûne aux familles vulnérables pendant tout le mois de Ramadan.',
    figures: ['Plus de 3 000 repas d’Iftar distribués'],
    recurrence: 'ANNUEL',
    isPublished: true,
    order: 1,
  },
  {
    slug: 'tabaski-solidaire-2026',
    image: '/images/events/tabaski-solidaire.jpg',
    programSlug: 'programme-alimentaire',
    title: 'Tabaski solidaire 2026',
    startDate: '2026-05-27',
    endDate: '2026-05-29',
    location: 'Cotonou',
    kind: 'DISTRIBUTION',
    description:
      'Collecte et distribution de viande aux familles vulnérables à l’occasion de la fête de Tabaski.',
    figures: ['4 bœufs et 4 moutons distribués'],
    recurrence: 'ANNUEL',
    isPublished: true,
    order: 2,
  },
  {
    slug: '1001-paniers-2026',
    image: '/images/terrain/don-de-vivres.jpg',
    programSlug: 'programme-alimentaire',
    title: '1001 Paniers',
    startDate: '2026-01-15',
    location: 'Cotonou — Fidjrossè et quartiers voisins',
    kind: 'DISTRIBUTION',
    description:
      'Distribution de colis alimentaires aux familles vulnérables identifiées avec les relais communautaires.',
    figures: ['1 000 paniers alimentaires distribués'],
    recurrence: 'MENSUEL',
    isPublished: true,
    order: 3,
  },
  {
    slug: 'sadaqa-du-vendredi',
    image: '/images/terrain/don-de-vivres-2.jpg',
    programSlug: 'programme-alimentaire',
    title: '1001 Sadaqa du vendredi',
    startDate: '2026-01-09',
    location: 'Cotonou',
    kind: 'DISTRIBUTION',
    description:
      'Rendez-vous hebdomadaire de distribution de repas solidaires aux personnes en difficulté.',
    figures: ['Distribution moyenne de 500 repas par mois'],
    recurrence: 'MENSUEL',
    isPublished: true,
    order: 4,
  },
  {
    slug: 'nuit-des-entreprises-solidaires-2026',
    image: '/images/events/nuit-des-entreprises.jpg',
    programSlug: null,
    title: 'Nuit des entreprises solidaires',
    startDate: '2026-11-20',
    location: 'Cotonou',
    kind: 'JOURNEE_SOLIDAIRE',
    description:
      'Soirée de reconnaissance des entreprises engagées aux côtés de l’association, avec remise de trophées aux trois premières contributions de l’année.',
    figures: [],
    recurrence: 'ANNUEL',
    isPublished: false,
    order: 5,
  },
  {
    slug: 'nuit-des-benevoles-2026',
    image: '/images/events/nuit-des-benevoles.jpg',
    programSlug: null,
    title: 'Nuit des bénévoles',
    startDate: '2026-12-05',
    location: 'Cotonou',
    kind: 'JOURNEE_SOLIDAIRE',
    description:
      'Soirée de valorisation de l’engagement des bénévoles, avec remise de trophées aux parcours les plus marquants de l’année.',
    figures: [],
    recurrence: 'ANNUEL',
    isPublished: false,
    order: 6,
  },
];

const TEAM = [
  {
    name: 'ASSANI Madinath',
    role: 'Présidente',
    image: '/team/assani-madinath.png',
    order: 1,
  },
  {
    name: 'ASSANI Nassifath',
    role: 'Vice-présidente',
    image: '/team/assani-nassifath.png',
    order: 2,
  },
  {
    name: 'EL-BAKKALI Imane',
    role: 'Secrétaire générale',
    image: '/team/el-bakkali-imane.png',
    order: 3,
  },
  {
    name: 'ASSANI Djamilath',
    role: 'Trésorière',
    // Portrait non fourni : la carte affiche son état vide, dessiné dans la
    // charte. Déposer le fichier et renseigner ce champ suffira.
    image: null,
    order: 4,
  },
];

// Partenaires. Les logos sont fournis par l'association ; les adresses de site
// sont volontairement absentes plutôt que devinées — à renseigner depuis le
// back-office.
const PARTNERS = [
  {
    name: 'HINMA Food',
    logo: '/partners/dangote-salt.png',
    type: PartnerType.ENTERPRISE,
    order: 1,
  },
  {
    name: 'Sothema',
    logo: '/partners/sothema.png',
    type: PartnerType.ENTERPRISE,
    order: 2,
  },
  {
    name: 'Ajanta Pharma',
    logo: '/partners/ajanta-pharma.png',
    type: PartnerType.ENTERPRISE,
    order: 3,
  },
  {
    name: 'Les Ateliers Greenlab',
    logo: '/partners/greenlab.png',
    type: PartnerType.ENTERPRISE,
    order: 4,
  },
];

const MISSIONS = [
  {
    slug: 'distribution-alimentaire',
    title: 'Distribution alimentaire',
    kind: MissionKind.FIELD,
    description: 'Préparation des paniers, accueil des familles, logistique du jour J.',
    commitment: '1 samedi par mois · Cotonou',
    order: 1,
  },
  {
    slug: 'visites-personnes-agees',
    title: 'Visites aux personnes âgées',
    kind: MissionKind.FIELD,
    description: 'Visites à domicile, écoute et accompagnement administratif.',
    commitment: '2 h par semaine · Fidjrossè',
    order: 2,
  },
  {
    slug: 'communication-medias',
    title: 'Communication & médias',
    kind: MissionKind.SKILLS,
    description: 'Photo, vidéo, rédaction pour le SADAQA Media Engine.',
    commitment: 'À distance ou sur site',
    order: 3,
  },
  {
    slug: 'soutien-scolaire',
    title: 'Soutien scolaire',
    kind: MissionKind.SKILLS,
    description: "Accompagnement des enfants suivis par l'association.",
    commitment: '2 après-midi par mois',
    order: 4,
  },
];

const DOCUMENTS = [
  {
    title: "Fiche projet — Point d'eau communautaire",
    fileUrl: '/documents/fiche-projet-point-eau.pdf',
    fileSize: '1,2 Mo',
    order: 1,
  },
  {
    title: 'Appel à partenariat — Rentrée scolaire 2026',
    fileUrl: '/documents/appel-partenariat-rentree-2026.pdf',
    fileSize: '850 Ko',
    order: 2,
  },
  {
    title: "Rapport d'activité annuel",
    fileUrl: '/documents/rapport-activite-annuel.pdf',
    fileSize: '3,4 Mo',
    order: 3,
  },
  {
    title: "Kit RSE — indicateurs d'impact",
    fileUrl: '/documents/kit-rse-indicateurs-impact.pdf',
    fileSize: '620 Ko',
    order: 4,
  },
];

/**
 * ATTENTION — ces trois témoignages sont FICTIFS.
 *
 * Ils servent à donner au site son aspect définitif en attendant les paroles
 * recueillies sur le terrain par le SADAQA Media Engine. Les prénoms et
 * l'organisation citée sont inventés : aucune personne réelle n'a tenu ces
 * propos. À remplacer avant la mise en ligne (voir README, § 6).
 *
 * Le témoignage « partenaire » n'attribue volontairement aucun propos aux
 * entreprises réellement partenaires : leur prêter des mots qu'elles n'ont pas
 * dits engagerait l'association.
 */
const TESTIMONIALS = [
  {
    name: 'Adjovi K.',
    role: 'Bénéficiaire · Fidjrossè',
    type: TestimonialType.BENEFICIARY,
    content:
      "Avant, je comptais les jours jusqu'au prochain marché. Aujourd'hui, le panier arrive chaque samedi et mes trois enfants mangent le soir. Ce qui a le plus changé, c'est que quelqu'un passe demander comment nous allons.",
    order: 1,
  },
  {
    name: 'Rachidath S.',
    role: 'Bénévole · Distributions',
    type: TestimonialType.VOLUNTEER,
    content:
      "Je donne un samedi par mois depuis deux ans. On prépare les paniers le matin, on accueille les familles l'après-midi. Ce qui me retient, c'est qu'on revoit les mêmes visages et qu'on voit où ils en sont.",
    order: 2,
  },
  {
    name: 'Coopérative Yèdo',
    role: 'Partenaire · Appui logistique',
    type: TestimonialType.PARTNER,
    content:
      "Nous prêtons nos véhicules pour les distributions. Ce que nous apprécions, c'est le compte rendu : on sait combien de familles ont été servies et dans quel quartier. Peu d'associations vont jusque-là.",
    order: 3,
  },
];

const GALLERY = [
  { file: '/images/gallery/01.jpg', alt: 'Étal de tissus dans un marché de Cotonou' },
  { file: '/images/gallery/02.jpg', alt: 'Village lacustre de Ganvié, au nord de Cotonou' },
  { file: '/images/gallery/03.jpg', alt: 'Groupe d’enfants réunis en cercle dans une cour' },
  { file: '/images/gallery/04.jpg', alt: 'Travail de la terre dans un champ, en fin de journée' },
  { file: '/images/gallery/05.jpg', alt: 'Atelier d’artisan ouvert sur la rue' },
  { file: '/images/gallery/06.jpg', alt: 'Vendeur ambulant et taxi-moto dans une rue de Cotonou' },
];

/**
 * Banque alimentaire : catégories suivies et registre d'ouverture.
 *
 * Le stock n'est pas un champ : il se déduit des mouvements. On pose donc une
 * entrée d'inventaire par catégorie plutôt qu'une quantité, ce qui donne dès
 * le départ un registre cohérent avec ce qu'affiche la page.
 */
async function seedBanqueAlimentaire(): Promise<void> {
  const CATEGORIES = [
    { slug: 'riz-cereales', name: 'Riz & céréales', unit: 'kg', stock: 1620, target: 2000, lowLevel: 600, criticalLevel: 250, examples: 'Riz, maïs, mil, sorgho' },
    { slug: 'eau', name: 'Eau embouteillée', unit: 'L', stock: 1095, target: 1400, lowLevel: 400, criticalLevel: 150, examples: 'Bouteilles et sachets d’eau' },
    { slug: 'conserves', name: 'Conserves', unit: 'u.', stock: 940, target: 1200, lowLevel: 350, criticalLevel: 150, examples: 'Tomate, sardines, pois' },
    { slug: 'pates-semoule', name: 'Pâtes & semoule', unit: 'kg', stock: 470, target: 700, lowLevel: 200, criticalLevel: 90, examples: 'Spaghettis, couscous' },
    { slug: 'farine', name: 'Farine', unit: 'kg', stock: 340, target: 500, lowLevel: 150, criticalLevel: 60, examples: 'Farine de blé, de maïs' },
    { slug: 'huile', name: 'Huile', unit: 'L', stock: 310, target: 450, lowLevel: 130, criticalLevel: 60, examples: 'Huile végétale, huile de palme' },
    { slug: 'produits-frais', name: 'Produits frais', unit: 'kg', stock: 220, target: 350, lowLevel: 90, criticalLevel: 40, examples: 'Légumes, tubercules' },
    { slug: 'legumineuses', name: 'Légumineuses', unit: 'kg', stock: 180, target: 250, lowLevel: 200, criticalLevel: 80, examples: 'Haricots, lentilles, pois' },
    { slug: 'lait-infantile', name: 'Lait & produits infantiles', unit: 'u.', stock: 130, target: 180, lowLevel: 150, criticalLevel: 60, examples: 'Lait en poudre, farine infantile' },
    { slug: 'sucre-sel', name: 'Sucre & sel', unit: 'kg', stock: 95, target: 200, lowLevel: 110, criticalLevel: 40, examples: 'Sucre en poudre, sel iodé' },
    { slug: 'hygiene', name: 'Produits d’hygiène', unit: 'u.', stock: 40, target: 200, lowLevel: 120, criticalLevel: 60, examples: 'Savon, dentifrice, serviettes hygiéniques' },
  ];

  const parSlug = new Map<string, string>();

  for (const [index, categorie] of CATEGORIES.entries()) {
    const { slug, stock, ...donnees } = categorie;
    const enregistrement = await prisma.foodCategory.upsert({
      where: { slug },
      update: { ...donnees, order: index },
      create: { ...donnees, slug, order: index },
    });
    parSlug.set(slug, enregistrement.id);

    // Inventaire d'ouverture, posé une seule fois.
    const dejaLa = await prisma.stockMovement.count({
      where: { categoryId: enregistrement.id, counterpart: 'Inventaire d’ouverture' },
    });
    if (dejaLa === 0) {
      await prisma.stockMovement.create({
        data: {
          categoryId: enregistrement.id,
          direction: 'ENTREE',
          quantity: stock,
          counterpart: 'Inventaire d’ouverture',
          detail: 'Stock constaté à la mise en service du registre',
          occurredAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  const MOUVEMENTS = [
    { slug: 'huile', direction: 'ENTREE' as const, quantity: 400, counterpart: 'Société Bénin Agro', detail: '400 L d’huile', heures: 6 },
    { slug: 'riz-cereales', direction: 'SORTIE' as const, quantity: 190, counterpart: 'Quartier Ladji · 42 familles', detail: '38 paniers complets', peopleServed: 210, heures: 9 },
    { slug: 'farine', direction: 'ENTREE' as const, quantity: 120, counterpart: 'Boulangerie Al-Amine', detail: '120 kg de farine', heures: 31 },
    { slug: 'conserves', direction: 'SORTIE' as const, quantity: 180, counterpart: 'Orphelinat Espoir · 32 enfants', detail: '180 kg de vivres', peopleServed: 32, heures: 25 },
  ];

  for (const mouvement of MOUVEMENTS) {
    const categoryId = parSlug.get(mouvement.slug);
    if (!categoryId) continue;

    const dejaLa = await prisma.stockMovement.count({
      where: { categoryId, counterpart: mouvement.counterpart },
    });
    if (dejaLa > 0) continue;

    const { slug, heures, ...donnees } = mouvement;
    void slug;
    await prisma.stockMovement.create({
      data: {
        ...donnees,
        categoryId,
        occurredAt: new Date(Date.now() - heures * 60 * 60 * 1000),
      },
    });
  }
}

async function main(): Promise<void> {
  // ── Paramètres du site ──
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { group: setting.group, label: setting.label, isSecret: setting.isSecret ?? false },
      create: {
        key: setting.key,
        group: setting.group,
        label: setting.label,
        isSecret: setting.isSecret ?? false,
        value: setting.value as never,
      },
    });
  }

  // ── Compte administrateur ──
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@1001sadaqa.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Sadaqa2026!';
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Administration 1001 SADAQA',
      password: await bcrypt.hash(password, 12),
      role: Role.ADMIN,
    },
  });

  // ── Domaines d'intervention ──
  const domainIds = new Map<string, string>();
  for (const domain of DOMAINS) {
    const saved = await prisma.domain.upsert({
      where: { slug: domain.slug },
      update: domain,
      create: domain,
    });
    domainIds.set(domain.slug, saved.id);
  }

  // ── Programmes ──
  const programIds = new Map<string, string>();
  for (const { domainSlug, ...program } of PROGRAMS) {
    const data = { ...program, domainId: domainIds.get(domainSlug)! };
    const saved = await prisma.program.upsert({
      where: { slug: program.slug },
      update: data,
      create: data,
    });
    programIds.set(program.slug, saved.id);
  }


  // ── Projets et données d'impact ──
  for (const { programSlug, impacts, startDate, endDate, ...project } of PROJECTS) {
    const data = {
      ...project,
      programId: programIds.get(programSlug)!,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    };

    const saved = await prisma.project.upsert({
      where: { slug: project.slug },
      update: data,
      create: data,
    });

    // Les impacts sont réécrits à chaque passage : ils n'ont pas de clé
    // naturelle et doubleraient sinon.
    await prisma.impact.deleteMany({ where: { projectId: saved.id } });
    await prisma.impact.createMany({
      data: impacts.map((impact) => ({
        ...impact,
        projectId: saved.id,
        period: data.endDate ?? data.startDate ?? new Date(),
      })),
    });
  }

  // ── Causes à soutenir ──
  for (const { programSlug, ...campaign } of CAMPAIGNS) {
    const data = { ...campaign, programId: programIds.get(programSlug)! };
    await prisma.campaign.upsert({
      where: { slug: campaign.slug },
      update: data,
      create: data,
    });
  }

  // ── Événements réalisés ──
  for (const { programSlug, startDate, endDate, ...event } of EVENTS) {
    const data = {
      ...event,
      kind: event.kind as EventKind,
      recurrence: event.recurrence as Recurrence,
      programId: programSlug ? programIds.get(programSlug)! : null,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    };

    await prisma.event.upsert({
      where: { slug: event.slug },
      update: data,
      create: data,
    });
  }

  // ── Actualités ──
  for (const { publishedAt, ...article } of NEWS) {
    const data = {
      ...article,
      authorId: admin.id,
      isPublished: true,
      publishedAt: new Date(publishedAt),
    };
    await prisma.news.upsert({
      where: { slug: article.slug },
      update: data,
      create: data,
    });
  }

  // ── Équipe, missions, documents ──
  for (const member of TEAM) {
    const existing = await prisma.teamMember.findFirst({ where: { name: member.name } });
    existing
      ? await prisma.teamMember.update({ where: { id: existing.id }, data: member })
      : await prisma.teamMember.create({ data: member });
  }

  for (const mission of MISSIONS) {
    await prisma.volunteerMission.upsert({
      where: { slug: mission.slug },
      update: mission,
      create: mission,
    });
  }

  for (const partner of PARTNERS) {
    const existing = await prisma.partner.findFirst({ where: { name: partner.name } });
    existing
      ? await prisma.partner.update({ where: { id: existing.id }, data: partner })
      : await prisma.partner.create({ data: partner });
  }

  for (const document of DOCUMENTS) {
    const existing = await prisma.document.findFirst({ where: { title: document.title } });
    existing
      ? await prisma.document.update({ where: { id: existing.id }, data: document })
      : await prisma.document.create({ data: document });
  }

  // ── Témoignages ──
  for (const testimonial of TESTIMONIALS) {
    const existing = await prisma.testimonial.findFirst({ where: { type: testimonial.type } });
    existing
      ? await prisma.testimonial.update({ where: { id: existing.id }, data: testimonial })
      : await prisma.testimonial.create({ data: testimonial });
  }

  // ── Galerie ──
  // Consentement renseigné en NOT_REQUIRED : ces visuels d'attente sont des
  // photographies sous licence libre, pas des médias de l'association. Les
  // médias terrain arriveront par la Media Library avec un consentement écrit.
  for (const [index, item] of GALLERY.entries()) {
    const objectKey = `field/${item.file.split('/').pop()}`;
    const data = {
      bucket: MediaBucket.FIELD,
      objectKey,
      url: item.file,
      mimeType: 'image/jpeg',
      sizeBytes: 0,
      altText: item.alt,
      credit: 'Wikimedia Commons — voir /images/CREDITS.md',
      tags: ['visuel-attente'],
      consentStatus: ConsentStatus.GRANTED,
      consentKind: ConsentKind.NOT_REQUIRED,
      consentScopes: [ConsentScope.WEB],
      consentNotes:
        "Photographie sous licence libre servant de visuel d'attente. À remplacer par un média du SADAQA Media Engine.",
      showInGallery: true,
      order: index + 1,
      uploadedById: admin.id,
    };

    await prisma.mediaAsset.upsert({
      where: { objectKey },
      update: data,
      create: data,
    });
  }

  // ── Un don d'exemple, pour que le back-office ne s'ouvre pas sur du vide ──
  const sample = await prisma.donation.findFirst({ where: { donorEmail: 'exemple@1001sadaqa.com' } });
  if (!sample) {
    await prisma.donation.create({
      data: {
        donorName: 'Don de démonstration',
        donorEmail: 'exemple@1001sadaqa.com',
        amount: 10_000,
        method: DonationMethod.MOBILE_MONEY,
        frequency: DonationFrequency.ONE_TIME,
        programId: programIds.get('programme-alimentaire'),
      },
    });
  }


  // Les cinq programmes de la version précédente laissent place aux huit du
  // dossier institutionnel. On ne les supprime que s'ils ne portent plus rien :
  // un rattachement oublié doit se voir, pas disparaître en silence.
  const obsoletes = await prisma.program.findMany({
    where: { slug: { notIn: PROGRAMS.map((p) => p.slug) } },
    include: { _count: { select: { projects: true, campaigns: true, donations: true } } },
  });

  for (const programme of obsoletes) {
    const { projects, campaigns, donations } = programme._count;
    if (projects + campaigns + donations > 0) {
      console.warn(
        `Programme « ${programme.title} » conservé : ${projects} projet(s), ` +
          `${campaigns} cause(s) et ${donations} don(s) y sont encore rattachés.`,
      );
      continue;
    }
    await prisma.program.delete({ where: { id: programme.id } });
  }

  await seedBanqueAlimentaire();

  // Ce qui arrive par les formulaires : messages, adhésions, dons. Sans eux,
  // le tableau de bord n'affiche que des zéros.
  const demo = await seedDemo(prisma);

  const counts = {
    domaines: await prisma.domain.count(),
    catégories: await prisma.foodCategory.count(),
    mouvements: await prisma.stockMovement.count(),
    programmes: await prisma.program.count(),
    projets: await prisma.project.count(),
    causes: await prisma.campaign.count(),
    événements: await prisma.event.count(),
    actualités: await prisma.news.count(),
    équipe: await prisma.teamMember.count(),
    missions: await prisma.volunteerMission.count(),
    partenaires: await prisma.partner.count(),
    documents: await prisma.document.count(),
    témoignages: await prisma.testimonial.count(),
    galerie: await prisma.mediaAsset.count(),
  };

  console.log('Seed terminé.', counts);
  console.log('Données de démonstration :', demo);
  console.log(`Compte administrateur : ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
