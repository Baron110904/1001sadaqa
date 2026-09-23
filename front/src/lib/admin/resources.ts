import type { CacheTag } from '@/lib/api';
import type { AdminUser } from './session';

/**
 * Description des contenus gérables depuis le back-office.
 *
 * Neuf types de contenu partagent la même mécanique : lister, créer, modifier,
 * supprimer. Les décrire en données plutôt que d'écrire neuf fois les mêmes
 * pages évite que les écrans divergent au fil des retouches — et surtout, un
 * dixième contenu ne demandera qu'une entrée ici.
 *
 * Les rôles reprennent les trois niveaux de validation du cahier des charges
 * (§ 5.1.2) : contenus courants aux éditeurs, contenus institutionnels et
 * données d'impact aux administrateurs. L'API applique la même règle de son
 * côté — l'interface ne fait que la refléter.
 */

export type Role = AdminUser['role'];

/** Rangements du stockage, tels que l'API les nomme. */
export type MediaBucket =
  | 'BRAND'
  | 'PROGRAMS'
  | 'PROJECTS'
  | 'NEWS'
  | 'TESTIMONIALS'
  | 'PARTNERS'
  | 'FIELD'
  | 'DOCUMENTS';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'money'
  | 'boolean'
  | 'select'
  | 'date'
  | 'image'
  | 'file'
  /** Liste de lignes, une entrée par ligne saisie. */
  | 'list'
  /** Suite de nombres séparés par des virgules. */
  | 'numbers';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  options?: { value: string; label: string }[];
  /** Liste d'options à charger depuis l'API. */
  optionsFrom?: 'programs' | 'domains' | 'foodCategories';
  /** Le champ occupe toute la largeur du formulaire. */
  wide?: boolean;
  min?: number;
  placeholder?: string;
  /** Case cochée d'office à la création. */
  defaultOn?: boolean;
}

export interface ColumnDef {
  name: string;
  label: string;
  /** Rendu compact : booléen en pastille, date formatée, etc. */
  kind?: 'text' | 'boolean' | 'badge' | 'number' | 'image';
}

export interface ResourceDef {
  slug: string;
  label: string;
  labelOne: string;
  /** Le nom au singulier est féminin : « une cause », « nouvelle cause ». */
  feminine?: boolean;
  /** Étiquette de cache à invalider après écriture, pour que le site suive. */
  tag: CacheTag;
  /** Rangement du stockage où partent les fichiers envoyés depuis la fiche. */
  bucket: MediaBucket;
  paths: {
    list: string;
    create: string;
    /** Gabarit contenant `:id`. Voir `itemPath`. */
    item: string;
  };
  fields: FieldDef[];
  columns: ColumnDef[];
  writeRoles: Role[];
  deleteRoles: Role[];
  /** Nom court, pour la navigation quand la rubrique est jumelée. */
  navLabel?: string;
  /**
   * Rubriques voisines, présentées en onglets au-dessus de la liste.
   *
   * La navigation range « Projets · Causes » sur une seule ligne, comme la
   * maquette : les onglets sont ce qui rend la seconde rubrique atteignable
   * sans lui donner sa propre entrée de menu. Les rubriques d'un même groupe
   * se désignent mutuellement.
   */
  siblings?: string[];
}

const ACTIVE: FieldDef = {
  name: 'isActive',
  label: 'Visible sur le site',
  type: 'boolean',
  // Un contenu que l'on vient de créer est destiné à paraître : le décocher
  // reste possible, mais ce n'est pas l'intention par défaut.
  defaultOn: true,
};

const ORDER: FieldDef = {
  name: 'order',
  label: 'Ordre d’affichage',
  type: 'number',
  help: 'Les valeurs les plus basses apparaissent en premier.',
};

export const RESOURCES: ResourceDef[] = [
  {
    slug: 'programmes',
    siblings: ["domaines"],
    tag: 'programs',
    bucket: 'PROGRAMS',
    label: 'Programmes',
    labelOne: 'programme',
    paths: {
      list: '/programs/admin',
      create: '/programs',
      item: '/programs/:id',
    },
    columns: [
      { name: 'title', label: 'Titre' },
      { name: 'shortLabel', label: 'Libellé court' },
      { name: 'status', label: 'État', kind: 'badge' },
      { name: 'order', label: 'Ordre', kind: 'number' },
      { name: 'isActive', label: 'Visible', kind: 'boolean' },
    ],
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true, wide: true },
      {
        name: 'status',
        label: 'État d’avancement',
        type: 'select',
        options: [
          { value: 'ACTIF', label: 'Actif' },
          { value: 'EN_PREPARATION', label: 'En préparation' },
        ],
        help: 'Filtre de la page publique. Indépendant de « Visible sur le site ».',
      },
      {
        name: 'shortLabel',
        label: 'Libellé court',
        type: 'text',
        required: true,
        help: 'Deux mots au plus.',
      },
      { name: 'icon', label: 'Icône (nom technique)', type: 'text' },
      {
        name: 'domainId',
        label: 'Domaine d’intervention',
        type: 'select',
        required: true,
        optionsFrom: 'domains',
      },
      {
        name: 'description',
        label: 'Phrase de résumé',
        type: 'textarea',
        required: true,
        wide: true,
        help: 'Deux à trois lignes, affichées en tête de fiche.',
      },
      {
        name: 'context',
        label: 'Le défi',
        type: 'richtext',
        wide: true,
        help: 'Le problème auquel le programme répond.',
      },
      { name: 'objectives', label: 'Nos objectifs', type: 'textarea', wide: true },
      { name: 'audience', label: 'Qui est accompagné', type: 'textarea', wide: true },
      {
        name: 'activities',
        label: 'Ce que nous mettons en œuvre',
        type: 'list',
        wide: true,
        help: 'Une activité par ligne.',
      },
      { name: 'outcomes', label: 'Ce que le programme produit', type: 'textarea', wide: true },
      { name: 'image', label: 'Image', type: 'image', wide: true },
      ORDER,
      ACTIVE,
    ],
    writeRoles: ['ADMIN'],
    deleteRoles: ['ADMIN'],
  },

  {
    slug: 'projets',
    siblings: ["causes"],
    tag: 'projects',
    bucket: 'PROJECTS',
    label: 'Projets',
    labelOne: 'projet',
    paths: {
      list: '/projects/admin',
      create: '/projects',
      item: '/projects/:id',
    },
    columns: [
      { name: 'title', label: 'Titre' },
      { name: 'status', label: 'Statut', kind: 'badge' },
      { name: 'location', label: 'Lieu' },
      { name: 'order', label: 'Ordre', kind: 'number' },
    ],
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true, wide: true },
      {
        name: 'programId',
        label: 'Programme',
        type: 'select',
        required: true,
        optionsFrom: 'programs',
      },
      {
        name: 'status',
        label: 'Où en est le projet',
        type: 'select',
        options: [
          { value: 'REALISE', label: 'Réalisé' },
          { value: 'EN_COURS', label: 'En cours' },
          { value: 'A_FINANCER', label: 'À financer' },
          { value: 'EN_PREPARATION', label: 'En préparation' },
        ],
      },
      {
        name: 'isPublished',
        label: 'Visible sur le site',
        type: 'boolean',
        // Distinct de l'état ci-dessus : un projet « à financer » a vocation à
        // être montré, un projet réalisé aussi.
        defaultOn: true,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        wide: true,
      },
      { name: 'content', label: 'Contenu détaillé', type: 'richtext', wide: true },
      { name: 'location', label: 'Lieu', type: 'text' },
      { name: 'problem', label: 'Le besoin auquel il répond', type: 'textarea', wide: true },
      { name: 'objectives', label: 'Ce que le projet vise', type: 'textarea', wide: true },
      { name: 'audience', label: 'Bénéficiaires', type: 'textarea', wide: true },
      { name: 'budget', label: 'Budget ou besoin (F CFA)', type: 'money' },
      {
        name: 'budgetVisibility',
        label: 'Qui voit le montant',
        type: 'select',
        options: [
          { value: 'MASQUE', label: 'Personne - masqué' },
          { value: 'PARTENAIRE', label: 'Les partenaires connectés' },
          { value: 'PUBLIC', label: 'Tout le monde' },
        ],
        help: 'Tous les montants ne sont pas communicables.',
      },
      { name: 'progress', label: 'Avancement (%)', type: 'number', min: 0 },
      {
        name: 'sdgs',
        label: 'ODD',
        type: 'numbers',
        help: 'Numéros séparés par des virgules, par exemple 1, 2, 3.',
      },
      { name: 'startDate', label: 'Date de début', type: 'date' },
      { name: 'endDate', label: 'Date de fin', type: 'date' },
      { name: 'image', label: 'Image', type: 'image', wide: true },
      {
        name: 'videos',
        label: 'Vidéos de terrain',
        type: 'list',
        wide: true,
        help: 'Une adresse par ligne : YouTube, Vimeo ou fichier hébergé.',
      },
      ORDER,
    ],
    writeRoles: ['ADMIN', 'EDITOR'],
    deleteRoles: ['ADMIN'],
  },

  {
    slug: 'actualites',
    siblings: ["evenements"],
    tag: 'news',
    bucket: 'NEWS',
    label: 'Actualités',
    labelOne: 'actualité',
    feminine: true,
    paths: {
      list: '/news/admin',
      create: '/news',
      item: '/news/:id',
    },
    columns: [
      { name: 'title', label: 'Titre' },
      { name: 'category', label: 'Rubrique', kind: 'badge' },
      { name: 'isPublished', label: 'Publiée', kind: 'boolean' },
      { name: 'isFeatured', label: 'À la une', kind: 'boolean' },
    ],
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true, wide: true },
      {
        name: 'category',
        label: 'Rubrique',
        type: 'select',
        options: [
          { value: 'TERRAIN', label: 'Terrain' },
          { value: 'COMMUNIQUE', label: 'Communiqué' },
          { value: 'PARTENARIAT', label: 'Partenariat' },
          { value: 'INSTITUTION', label: 'Institution' },
        ],
      },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'imageCaption', label: 'Légende de l’image', type: 'text', wide: true },
      {
        name: 'imageCredit',
        label: 'Crédit photo',
        type: 'text',
        help: 'Obligatoire dès que la photo n’est pas de l’association.',
      },
      {
        name: 'programId',
        label: 'Programme concerné',
        type: 'select',
        optionsFrom: 'programs',
        help: 'Alimente le filtre par programme de la liste publique.',
      },
      {
        name: 'excerpt',
        label: 'Chapeau',
        type: 'textarea',
        wide: true,
        help: 'Deux lignes.',
      },
      {
        name: 'content',
        label: 'Article',
        type: 'richtext',
        required: true,
        wide: true,
        help: 'Séparez les paragraphes par une ligne vide.',
      },
      { name: 'isPublished', label: 'Publier', type: 'boolean' },
      { name: 'isFeatured', label: 'Mettre à la une', type: 'boolean' },
    ],
    writeRoles: ['ADMIN', 'EDITOR', 'CONTRIBUTOR'],
    deleteRoles: ['ADMIN', 'EDITOR'],
  },

  {
    slug: 'causes',
    navLabel: 'Causes',
    siblings: ["projets"],
    tag: 'campaigns',
    bucket: 'PROJECTS',
    label: 'Causes à soutenir',
    labelOne: 'cause',
    feminine: true,
    paths: {
      list: '/campaigns/admin',
      create: '/campaigns',
      item: '/campaigns/:id',
    },
    columns: [
      { name: 'title', label: 'Titre' },
      { name: 'raised', label: 'Collecté', kind: 'number' },
      { name: 'goal', label: 'Objectif', kind: 'number' },
      { name: 'isActive', label: 'Visible', kind: 'boolean' },
    ],
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true, wide: true },
      {
        name: 'claim',
        label: 'Promesse',
        type: 'textarea',
        required: true,
        wide: true,
        help: 'En une phrase.',
      },
      { name: 'goal', label: 'Objectif (F CFA)', type: 'money', required: true, min: 1 },
      { name: 'raised', label: 'Déjà collecté (F CFA)', type: 'money', min: 0 },
      { name: 'programId', label: 'Programme', type: 'select', optionsFrom: 'programs' },
      { name: 'isUrgent', label: 'Marquer comme urgente', type: 'boolean' },
      { name: 'image', label: 'Image', type: 'image', wide: true },
      ORDER,
      ACTIVE,
    ],
    writeRoles: ['ADMIN'],
    deleteRoles: ['ADMIN'],
  },

  {
    slug: 'equipe',
    tag: 'team',
    bucket: 'BRAND',
    label: 'Équipe & gouvernance',
    labelOne: 'membre',
    paths: {
      list: '/team/admin',
      create: '/team',
      item: '/team/:id',
    },
    columns: [
      { name: 'image', label: '', kind: 'image' },
      { name: 'name', label: 'Nom' },
      { name: 'role', label: 'Fonction' },
      { name: 'isActive', label: 'Visible', kind: 'boolean' },
    ],
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'role', label: 'Fonction', type: 'text', required: true },
      { name: 'bio', label: 'Présentation', type: 'textarea', wide: true },
      { name: 'image', label: 'Portrait', type: 'image', wide: true },
      ORDER,
      ACTIVE,
    ],
    writeRoles: ['ADMIN'],
    deleteRoles: ['ADMIN'],
  },

  {
    slug: 'temoignages',
    tag: 'testimonials',
    bucket: 'TESTIMONIALS',
    label: 'Témoignages',
    labelOne: 'témoignage',
    paths: {
      list: '/testimonials/admin',
      create: '/testimonials',
      item: '/testimonials/:id',
    },
    columns: [
      { name: 'name', label: 'Nom' },
      { name: 'type', label: 'Type', kind: 'badge' },
      { name: 'role', label: 'Qualité' },
      { name: 'isActive', label: 'Visible', kind: 'boolean' },
    ],
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      {
        name: 'role',
        label: 'Qualité',
        type: 'text',
        placeholder: 'Bénéficiaire · Fidjrossè',
      },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'BENEFICIARY', label: 'Bénéficiaire' },
          { value: 'VOLUNTEER', label: 'Bénévole' },
          { value: 'PARTNER', label: 'Partenaire' },
        ],
      },
      { name: 'content', label: 'Témoignage', type: 'textarea', required: true, wide: true },
      { name: 'image', label: 'Photo', type: 'image', wide: true },
      ORDER,
      ACTIVE,
    ],
    writeRoles: ['ADMIN', 'EDITOR'],
    deleteRoles: ['ADMIN', 'EDITOR'],
  },

  {
    slug: 'partenaires',
    tag: 'partners',
    bucket: 'PARTNERS',
    label: 'Partenaires',
    labelOne: 'partenaire',
    paths: {
      list: '/partners/admin',
      create: '/partners',
      item: '/partners/:id',
    },
    columns: [
      { name: 'logo', label: '', kind: 'image' },
      { name: 'name', label: 'Nom' },
      { name: 'type', label: 'Type', kind: 'badge' },
      { name: 'isActive', label: 'Visible', kind: 'boolean' },
    ],
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'ENTERPRISE', label: 'Entreprise' },
          { value: 'INSTITUTION', label: 'Institution' },
          { value: 'FOUNDATION', label: 'Fondation' },
          { value: 'NGO', label: 'ONG' },
        ],
      },
      { name: 'logo', label: 'Logo', type: 'image', required: true, wide: true },
      { name: 'website', label: 'Site web', type: 'text', placeholder: 'https://…' },
      ORDER,
      ACTIVE,
    ],
    writeRoles: ['ADMIN'],
    deleteRoles: ['ADMIN'],
  },

  {
    slug: 'missions',
    tag: 'missions',
    bucket: 'FIELD',
    label: 'Missions bénévoles',
    labelOne: 'mission',
    feminine: true,
    paths: {
      list: '/volunteers/admin/missions',
      create: '/volunteers/missions',
      item: '/volunteers/missions/:id',
    },
    columns: [
      { name: 'title', label: 'Mission' },
      { name: 'kind', label: 'Type', kind: 'badge' },
      { name: 'commitment', label: 'Engagement' },
      { name: 'isActive', label: 'Ouverte', kind: 'boolean' },
    ],
    fields: [
      { name: 'title', label: 'Intitulé', type: 'text', required: true, wide: true },
      {
        name: 'kind',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'FIELD', label: 'Terrain' },
          { value: 'SKILLS', label: 'Compétences' },
        ],
      },
      {
        name: 'commitment',
        label: 'Engagement demandé',
        type: 'text',
        required: true,
        placeholder: '1 samedi par mois · Cotonou',
      },
      { name: 'description', label: 'Description', type: 'textarea', required: true, wide: true },
      ORDER,
      ACTIVE,
    ],
    writeRoles: ['ADMIN', 'EDITOR'],
    deleteRoles: ['ADMIN'],
  },

  {
    slug: 'documents',
    tag: 'documents',
    bucket: 'DOCUMENTS',
    label: 'Documents partenaires',
    labelOne: 'document',
    paths: {
      list: '/partners/admin/documents',
      create: '/partners/documents',
      item: '/partners/documents/:id',
    },
    columns: [
      { name: 'title', label: 'Document' },
      { name: 'fileType', label: 'Format' },
      { name: 'fileSize', label: 'Poids' },
      { name: 'isActive', label: 'Visible', kind: 'boolean' },
    ],
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true, wide: true },
      { name: 'fileUrl', label: 'Fichier', type: 'file', required: true, wide: true },
      { name: 'fileType', label: 'Format', type: 'text', placeholder: 'PDF' },
      { name: 'fileSize', label: 'Poids', type: 'text', placeholder: '1,2 Mo' },
      ORDER,
      ACTIVE,
    ],
    writeRoles: ['ADMIN'],
    deleteRoles: ['ADMIN'],
  },

  {
    slug: 'domaines',
    navLabel: 'Domaines',
    siblings: ["programmes"],
    tag: 'programs',
    bucket: 'PROGRAMS',
    label: 'Domaines d’intervention',
    labelOne: 'domaine',
    paths: {
      list: '/domains/admin',
      create: '/domains',
      item: '/domains/:id',
    },
    columns: [
      { name: 'name', label: 'Nom' },
      { name: 'order', label: 'Ordre', kind: 'number' },
      { name: 'isActive', label: 'Visible', kind: 'boolean' },
    ],
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true, wide: true },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        wide: true,
      },
      { name: 'icon', label: 'Icône (nom technique)', type: 'text' },
      {
        name: 'sdgs',
        label: 'ODD',
        type: 'numbers',
        help: 'Numéros séparés par des virgules, par exemple 1, 3, 4, 10.',
      },
      ORDER,
      ACTIVE,
    ],
    writeRoles: ['ADMIN'],
    deleteRoles: ['ADMIN'],
  },

  {
    slug: 'evenements',
    siblings: ["actualites"],
    tag: 'events',
    bucket: 'FIELD',
    label: 'Événements',
    labelOne: 'événement',
    paths: {
      list: '/events/admin',
      create: '/events',
      item: '/events/:id',
    },
    columns: [
      { name: 'title', label: 'Événement' },
      { name: 'startDate', label: 'Date' },
      { name: 'location', label: 'Lieu' },
      { name: 'isPublished', label: 'Publié', kind: 'boolean' },
    ],
    fields: [
      { name: 'title', label: 'Intitulé', type: 'text', required: true, wide: true },
      { name: 'programId', label: 'Programme', type: 'select', optionsFrom: 'programs' },
      { name: 'startDate', label: 'Date de début', type: 'date', required: true },
      { name: 'endDate', label: 'Date de fin', type: 'date' },
      { name: 'location', label: 'Lieu', type: 'text', required: true },
      {
        name: 'kind',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'DISTRIBUTION', label: 'Distribution' },
          { value: 'CAMPAGNE_SANTE', label: 'Campagne de santé' },
          { value: 'SENSIBILISATION', label: 'Sensibilisation' },
          { value: 'COLLECTE', label: 'Collecte' },
          { value: 'JOURNEE_SOLIDAIRE', label: 'Journée solidaire' },
        ],
      },
      {
        name: 'recurrence',
        label: 'Récurrence',
        type: 'select',
        options: [
          { value: 'PONCTUEL', label: 'Ponctuel' },
          { value: 'ANNUEL', label: 'Chaque année' },
          { value: 'MENSUEL', label: 'Chaque mois' },
        ],
        help: 'Relie les éditions successives d’un même rendez-vous.',
      },
      {
        name: 'description',
        label: 'Ce qui s’est passé',
        type: 'richtext',
        required: true,
        wide: true,
      },
      {
        name: 'figures',
        label: 'Chiffres',
        type: 'list',
        wide: true,
        help: 'Un chiffre par ligne, par exemple « 1 000 paniers distribués ».',
      },
      { name: 'image', label: 'Visuel', type: 'image', wide: true },
      ORDER,
      { name: 'isPublished', label: 'Publier', type: 'boolean' },
    ],
    writeRoles: ['ADMIN', 'EDITOR'],
    deleteRoles: ['ADMIN'],
  },

  {
    slug: 'campagnes-saisonnieres',
    tag: 'seasonal',
    bucket: 'BRAND',
    label: 'Campagnes saisonnières',
    labelOne: 'campagne',
    feminine: true,
    paths: {
      list: '/seasonal-campaigns',
      create: '/seasonal-campaigns',
      item: '/seasonal-campaigns/:id',
    },
    columns: [
      { name: 'name', label: 'Campagne' },
      { name: 'theme', label: 'Thème', kind: 'badge' },
      { name: 'startsAt', label: 'Début' },
      { name: 'isActive', label: 'Active', kind: 'boolean' },
    ],
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true, wide: true },
      {
        name: 'theme',
        label: 'Thème',
        type: 'select',
        options: [
          { value: 'RAMADAN', label: 'Ramadan' },
          { value: 'TABASKI', label: 'Tabaski' },
          { value: 'AUCUN', label: 'Aucun' },
        ],
      },
      { name: 'startsAt', label: 'Début', type: 'date', required: true },
      { name: 'endsAt', label: 'Fin', type: 'date', required: true },
      {
        name: 'bannerText',
        label: 'Message du bandeau',
        type: 'textarea',
        required: true,
        wide: true,
      },
      { name: 'bannerImage', label: 'Visuel du bandeau', type: 'image', wide: true },
      {
        name: 'pillLabel',
        label: 'Pastille de l’en-tête',
        type: 'text',
        help: 'Affichée à côté du bouton de don, sur toutes les pages. Ex. : Ramadan 1447.',
      },

      // ── Héros de la page d'accueil ──
      {
        name: 'heroTitle',
        label: 'Titre de la page d’accueil',
        type: 'text',
        wide: true,
        help: 'Dès qu’il est renseigné, l’accueil remplace son titre habituel. Le caractère | passe à la ligne suivante.',
      },
      {
        name: 'greeting',
        label: 'Salutation en arabe',
        type: 'text',
        help: 'Ex. : رمضان مبارك. Laissez vide si vous n’en voulez pas.',
      },
      {
        name: 'greetingLatin',
        label: 'Salutation translittérée',
        type: 'text',
        help: 'Ex. : Ramadan Moubarak.',
      },
      {
        name: 'heroLead',
        label: 'Paragraphe d’introduction',
        type: 'textarea',
        wide: true,
      },
      { name: 'ctaLabel', label: 'Bouton principal', type: 'text' },
      { name: 'ctaUrl', label: 'Destination du bouton principal', type: 'text' },
      { name: 'secondaryLabel', label: 'Bouton secondaire', type: 'text' },
      { name: 'secondaryUrl', label: 'Destination du bouton secondaire', type: 'text' },

      // ── Avancement ──
      { name: 'goal', label: 'Objectif', type: 'number' },
      {
        name: 'progressCurrent',
        label: 'Avancement',
        type: 'number',
        help: 'Dans la même unité que l’objectif.',
      },
      {
        name: 'progressUnit',
        label: 'Unité comptée',
        type: 'text',
        help: 'Ex. : iftars, parts. Sert aux libellés « 68 parts déjà offertes ».',
      },
      {
        name: 'figures',
        label: 'Chiffres mis en avant',
        type: 'list',
        wide: true,
        help: 'Une ligne par chiffre, au format valeur|libellé. Ex. : 4|quartiers couverts',
      },

      // ── Offres de contribution ──
      {
        name: 'offers',
        label: 'Offres de contribution',
        type: 'list',
        wide: true,
        help: 'Une ligne par carte, au format libellé|montant|description. Montant vide = montant libre. Ajoutez * au libellé pour mettre la carte en avant. Ex. : Un mouton entier*|95000|Sept parts distribuées.',
      },
      {
        name: 'marquee',
        label: 'Bandeau défilant',
        type: 'list',
        wide: true,
        help: 'Une mention par ligne. Le bandeau n’apparaît qu’à partir de deux mentions.',
      },

      // ── Bande basse du jour ──
      // La bande basse est propre au Ramadan : elle annonce l'heure de
      // rupture du jeûne, qui n'a pas d'équivalent à la Tabaski. Sur une
      // campagne d'un autre thème, ces champs restent sans effet.
      {
        name: 'dailyEnabled',
        label: 'Afficher la bande du jour (Ramadan uniquement)',
        type: 'boolean',
        help: 'Barre fixée en bas de toutes les pages pendant la campagne. Sans effet sur une campagne qui n’est pas un Ramadan.',
      },
      { name: 'dailyTitle', label: 'Rendez-vous du jour', type: 'text', wide: true },
      {
        name: 'dailyTime',
        label: 'Heure de rupture du jeûne',
        type: 'text',
        help: 'Au format 18:52.',
      },
      { name: 'dailyCount', label: 'Couverts prévus', type: 'number' },
      // Le bouton mène au don, toujours : c'est le geste que la bande
      // appelle. Il n'y a donc pas d'adresse à saisir — demander une URL dans
      // un formulaire de contenu laisse un détail technique à la charge de
      // qui rédige, et la première faute de frappe mène à une page absente.
      { name: 'dailyCtaLabel', label: 'Bouton de la bande', type: 'text' },

      {
        name: 'isActive',
        label: 'Activer l’habillage',
        type: 'boolean',
        help: 'Le site reprend son aspect normal à la fin de la période, sans intervention.',
      },
    ],
    writeRoles: ['ADMIN'],
    deleteRoles: ['ADMIN'],
  },

  {
    slug: 'stocks',
    navLabel: 'Stock',
    siblings: ['mouvements'],
    tag: 'foodbank',
    bucket: 'FIELD',
    label: 'Banque alimentaire',
    labelOne: 'catégorie',
    feminine: true,
    paths: {
      list: '/foodbank/admin/categories',
      create: '/foodbank/categories',
      item: '/foodbank/categories/:id',
    },
    columns: [
      { name: 'name', label: 'Catégorie' },
      { name: 'quantity', label: 'En stock', kind: 'number' },
      { name: 'unit', label: 'Unité' },
      { name: 'level', label: 'Niveau', kind: 'badge' },
      { name: 'isActive', label: 'Visible', kind: 'boolean' },
    ],
    fields: [
      { name: 'name', label: 'Nom de la catégorie', type: 'text', required: true, wide: true },
      {
        name: 'unit',
        label: 'Unité',
        type: 'text',
        help: 'kg, L, u. - telle qu’elle s’affiche sur la page.',
      },
      {
        name: 'examples',
        label: 'Exemples de denrées',
        type: 'textarea',
        wide: true,
        help: 'Affichés sous la carte de besoin : « Haricots, lentilles, pois ».',
      },
      {
        name: 'target',
        label: 'Niveau visé',
        type: 'number',
        help: 'Dénominateur de l’affichage : « 180 sur 250 ».',
      },
      {
        name: 'lowLevel',
        label: 'Seuil « bas »',
        type: 'number',
        help: 'En dessous, la catégorie est signalée comme manquante.',
      },
      {
        name: 'criticalLevel',
        label: 'Seuil « critique »',
        type: 'number',
        help: 'En dessous, elle passe en tête des besoins.',
      },
      ORDER,
      ACTIVE,
    ],
    writeRoles: ['ADMIN'],
    deleteRoles: ['ADMIN'],
  },


  {
    slug: 'mouvements',
    navLabel: 'Mouvements',
    siblings: ['stocks'],
    tag: 'foodbank',
    bucket: 'FIELD',
    label: 'Mouvements de stock',
    labelOne: 'mouvement',
    paths: {
      list: '/foodbank/movements?limit=200',
      create: '/foodbank/movements',
      item: '/foodbank/movements/:id',
    },
    columns: [
      { name: 'direction', label: 'Sens', kind: 'badge' },
      { name: 'counterpart', label: 'Donateur ou bénéficiaire' },
      { name: 'quantity', label: 'Quantité', kind: 'number' },
      { name: 'detail', label: 'Précision' },
    ],
    fields: [
      {
        name: 'categoryId',
        label: 'Catégorie',
        type: 'select',
        required: true,
        optionsFrom: 'foodCategories',
      },
      {
        name: 'direction',
        label: 'Sens du mouvement',
        type: 'select',
        required: true,
        options: [
          { value: 'ENTREE', label: 'Entrée - un don arrive' },
          { value: 'SORTIE', label: 'Sortie - une distribution part' },
        ],
      },
      {
        name: 'quantity',
        label: 'Quantité',
        type: 'number',
        required: true,
        help: 'Toujours positive : c’est le sens qui retire ou ajoute au stock.',
      },
      {
        name: 'counterpart',
        label: 'Donateur ou bénéficiaire',
        type: 'text',
        required: true,
        wide: true,
        help: 'Qui donne, pour une entrée ; qui reçoit, pour une sortie.',
      },
      {
        name: 'detail',
        label: 'Précision',
        type: 'text',
        wide: true,
        help: 'Affichée au registre : « 38 paniers complets », « 400 L d’huile ».',
      },
      {
        name: 'peopleServed',
        label: 'Personnes servies',
        type: 'number',
        help: 'Pour une sortie. Alimente le compteur du flux mensuel.',
      },
      { name: 'occurredAt', label: 'Date du mouvement', type: 'date' },
    ],
    writeRoles: ['ADMIN', 'EDITOR'],
    deleteRoles: ['ADMIN'],
  },

  {
    slug: 'newsletter',
    tag: 'news',
    bucket: 'NEWS',
    label: 'Lettre d’information',
    labelOne: 'inscription',
    feminine: true,
    paths: {
      list: '/newsletter/admin',
      create: '/newsletter/subscribe',
      item: '/newsletter/:id',
    },
    columns: [
      { name: 'email', label: 'Adresse' },
      { name: 'name', label: 'Nom' },
      { name: 'source', label: 'Origine' },
      { name: 'isActive', label: 'Abonnée', kind: 'boolean' },
    ],
    // Une inscription ne se crée ni ne se modifie depuis le back-office :
    // elle vient d’un consentement donné sur le site. Seule la suppression
    // est offerte, pour honorer une demande d’effacement.
    fields: [],
    writeRoles: [],
    deleteRoles: ['ADMIN'],
  },
];

/**
 * Chemin d'API d'un élément. Le gabarit est une chaîne et non une fonction :
 * un descripteur porteur de fonctions ne peut pas être transmis à un composant
 * client, ce que React refuse à la sérialisation.
 */
export function itemPath(resource: ResourceDef, id: string): string {
  return resource.paths.item.replace(':id', id);
}

export function findResource(slug: string): ResourceDef | undefined {
  return RESOURCES.find((resource) => resource.slug === slug);
}

export function canWrite(resource: ResourceDef, user: AdminUser): boolean {
  return resource.writeRoles.includes(user.role);
}

export function canDelete(resource: ResourceDef, user: AdminUser): boolean {
  return resource.deleteRoles.includes(user.role);
}

/** Ressources visibles pour ce rôle : on ne montre pas ce qui sera refusé. */
export function resourcesFor(user: AdminUser): ResourceDef[] {
  return RESOURCES.filter((resource) => resource.writeRoles.includes(user.role));
}
