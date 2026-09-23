import { SettingGroup } from '@prisma/client';

/**
 * Clés de configuration éditables depuis le back-office.
 *
 * La passerelle de paiement est décrite ici : l'association choisit son
 * fournisseur, saisit ses clés et coche les moyens de paiement, sans
 * intervention technique ni déploiement. `payment.enabled` à false laisse le
 * formulaire de don fonctionner en mode « enregistrement + instructions de
 * règlement ».
 */
export const PAYMENT_KEYS = {
  enabled: 'payment.enabled',
  sandbox: 'payment.sandbox',
  methods: 'payment.methods',
  publicKey: 'payment.publicKey',
  secretKey: 'payment.secretKey',
  webhookSecret: 'payment.webhookSecret',
  mobileMoneyInstructions: 'payment.instructions.mobileMoney',
  bankDetails: 'payment.instructions.bank',
} as const;

/**
 * Agrégateur de paiement : FedaPay, et lui seul.
 *
 * L'association a arrêté son choix ; il n'y a donc plus rien à sélectionner au
 * back-office, et le réglage correspondant a été retiré. Un menu à une seule
 * entrée ne fait que donner l'illusion d'une décision à prendre.
 *
 * La passerelle ne s'ouvre pas pour autant : `payment.enabled` commande seul
 * l'encaissement en ligne, et il reste à implémenter l'appel à l'API FedaPay.
 */
export const PAYMENT_PROVIDER = 'fedapay' as const;
export type PaymentProvider = typeof PAYMENT_PROVIDER;

export interface SettingSeed {
  key: string;
  group: SettingGroup;
  label: string;
  value: unknown;
  isSecret?: boolean;
}

export const DEFAULT_SETTINGS: SettingSeed[] = [
  // ── Général ──
  {
    key: 'site.name',
    group: SettingGroup.GENERAL,
    label: 'Nom du site',
    value: '1001 SADAQA',
  },
  {
    key: 'site.tagline',
    group: SettingGroup.GENERAL,
    label: 'Accroche',
    value: 'Association humanitaire et sociale — Cotonou, Bénin',
  },
  // ── Chiffres d'impact non dérivables de la base ──
  // Les nombres de programmes et de projets sont comptés en base ; ces deux
  // valeurs-ci sont déclaratives et se règlent depuis le back-office.
  {
    key: 'impact.peopleHelped',
    group: SettingGroup.GENERAL,
    label: 'Personnes aidées (chiffre affiché sur le site)',
    value: 1200,
  },
  {
    key: 'impact.communities',
    group: SettingGroup.GENERAL,
    label: 'Communes couvertes',
    value: 4,
  },
  // ── Contact ──
  {
    key: 'contact.phone',
    group: SettingGroup.CONTACT,
    label: 'Téléphone',
    value: '+229 01 91 43 45 91',
  },
  {
    key: 'contact.email',
    group: SettingGroup.CONTACT,
    label: 'Courriel',
    value: 'contact@1001sadaqa.com',
  },
  {
    key: 'contact.address',
    group: SettingGroup.CONTACT,
    label: 'Adresse',
    value: 'Fidjrossè, Houta M/ASSANI Lot 3561, Cotonou, Bénin',
  },
  {
    key: 'contact.whatsapp',
    group: SettingGroup.CONTACT,
    label: 'Numéro WhatsApp Business (format international, sans espaces)',
    value: '2290191434591',
  },
  // ── Réseaux ──
  {
    key: 'social.facebook',
    group: SettingGroup.SOCIAL,
    label: 'Page Facebook',
    value: 'https://www.facebook.com/profile.php?id=61587609625367',
  },
  {
    key: 'social.linkedin',
    group: SettingGroup.SOCIAL,
    label: 'Page LinkedIn',
    value: '',
  },
  {
    key: 'social.tiktok',
    group: SettingGroup.SOCIAL,
    label: 'Compte TikTok',
    value: '',
  },
  // ── Courriel ──
  //
  // Le service est écrit et appelé partout où le guide l'exige ; il ne part
  // qu'une fois ces clés renseignées et un fournisseur implémenté. Tant
  // qu'elles sont vides, les messages sont journalisés, jamais perdus en
  // silence.
  {
    key: 'mail.enabled',
    group: SettingGroup.GENERAL,
    label: "Activer l'envoi de courriels",
    value: false,
  },
  {
    key: 'mail.host',
    group: SettingGroup.GENERAL,
    label: 'Serveur d’envoi (SMTP ou service transactionnel)',
    value: '',
  },
  {
    key: 'mail.from',
    group: SettingGroup.GENERAL,
    label: 'Adresse expéditrice',
    value: '',
  },
  {
    key: 'mail.internalTo',
    group: SettingGroup.GENERAL,
    label: 'Adresse recevant les notifications internes',
    value: '',
  },

  // ── Paiement ──
  {
    key: PAYMENT_KEYS.enabled,
    group: SettingGroup.PAYMENT,
    label: 'Activer la passerelle de paiement en ligne',
    value: false,
  },
  {
    key: PAYMENT_KEYS.sandbox,
    group: SettingGroup.PAYMENT,
    label: 'Mode test (sandbox)',
    value: true,
  },
  {
    key: PAYMENT_KEYS.methods,
    group: SettingGroup.PAYMENT,
    label: 'Moyens de paiement proposés',
    value: ['MOBILE_MONEY', 'BANK_TRANSFER', 'CARD'],
  },
  {
    key: PAYMENT_KEYS.publicKey,
    group: SettingGroup.PAYMENT,
    label: 'Clé publique du fournisseur',
    value: '',
  },
  {
    key: PAYMENT_KEYS.secretKey,
    group: SettingGroup.PAYMENT,
    label: 'Clé secrète du fournisseur',
    value: '',
    isSecret: true,
  },
  {
    key: PAYMENT_KEYS.webhookSecret,
    group: SettingGroup.PAYMENT,
    label: 'Secret du webhook FedaPay (Workbench → Webhooks → Click to reveal)',
    value: '',
    isSecret: true,
  },
  {
    key: PAYMENT_KEYS.mobileMoneyInstructions,
    group: SettingGroup.PAYMENT,
    label: 'Instructions Mobile Money affichées après le formulaire',
    value:
      'Envoyez votre don au +229 01 91 43 45 91 (MTN MoMo / Moov Money) en indiquant votre nom en référence. Un reçu vous est adressé par e-mail.',
  },
  {
    key: PAYMENT_KEYS.bankDetails,
    group: SettingGroup.PAYMENT,
    label: 'Coordonnées bancaires pour les virements',
    value: 'Coordonnées bancaires à compléter par l’association.',
  },
  // ── Analytics ──
  {
    key: 'analytics.ga4Id',
    group: SettingGroup.ANALYTICS,
    label: 'Identifiant de mesure Google Analytics 4',
    value: '',
  },
];
