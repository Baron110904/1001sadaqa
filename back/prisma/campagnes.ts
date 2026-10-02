import { PrismaClient, CampaignTheme } from '@prisma/client';

/**
 * Les deux habillages de fête de l'association.
 *
 * Ils étaient saisis à la main dans le back-office, donc absents de toute
 * installation neuve : le site déployé perdait son habillage sans que rien ne
 * l'explique. Ce sont des contenus permanents, pas des données d'essai — leur
 * place est dans le seed, au même titre que les programmes.
 *
 * Les dates sont volontairement relatives à aujourd'hui, et non figées : une
 * campagne posée sur des dates révolues ne s'afficherait jamais, et l'on
 * croirait l'habillage cassé. L'association les ajuste ensuite au calendrier
 * réel depuis le back-office.
 *
 * Réentrant : reconnu au `slug`, mis à jour plutôt que dupliqué. L'état
 * `isActive` n'est **pas** réécrit lors d'une mise à jour — sans quoi relancer
 * le seed éteindrait une campagne que l'association venait d'allumer.
 */

const JOUR = 86_400_000;
const dans = (n: number) => new Date(Date.now() + n * JOUR);

const CAMPAGNES = [
  {
    name: 'Ramadan 1447',
    slug: 'ramadan-1447',
    theme: CampaignTheme.RAMADAN,
    startsAt: dans(-11),
    endsAt: dans(18),
    bannerText: 'Ramadan 1447 : chaque soir, un iftar complet pour une famille de Cotonou.',
    ctaLabel: 'Offrir un iftar',
    ctaUrl: '/communaute/donateur',
    goal: 2400,
    greeting: 'رمضان مبارك',
    greetingLatin: 'Ramadan Moubarak',
    pillLabel: 'Ramadan 1447',
    heroTitle: 'Trente nuits|pour changer|trente vies.',
    heroLead:
      'Chaque soir du mois, votre don finance un iftar complet à 2 000 F. Un geste par nuit, une année d’écart pour un foyer.',
    secondaryLabel: 'Calculer ma zakât',
    secondaryUrl: '/communaute/donateur',
    progressUnit: 'iftars',
    progressCurrent: 1480,
    figures: [],
    offers: [
      'Iftar du soir|2000|2 000 F offrent un repas complet de rupture du jeûne à une personne.',
      'Semaine d’iftars|14000|Sept soirs de repas pour une personne, ou un soir pour sept.',
      'Zakât al-Fitr*||Acquittez votre zakât en ligne, distribuée avant l’Aïd.',
    ],
    marquee: [
      'Nuits du Ramadan',
      'Nuit du Destin',
      'Iftar collectif · quartier de Fidjrossè',
      'Zakât al-Fitr',
      'Paniers du Ramadan',
    ],
    dailyEnabled: true,
    dailyTitle: 'Iftar collectif à Fidjrossè',
    dailyTime: '18:52',
    dailyCount: 240,
    dailyCtaLabel: 'Parrainer un couvert',
    // Une seule campagne peut être active à la fois : l'API refuse deux
    // périodes qui se chevauchent. C'est le Ramadan qui est allumé par défaut.
    isActive: true,
  },
  {
    name: 'Tabaski 2027',
    slug: 'tabaski-2027',
    theme: CampaignTheme.TABASKI,
    // Posée après le Ramadan : deux campagnes actives sur une même période
    // seraient refusées, et des dates qui se chevauchent empêchent d'allumer
    // la seconde sans éteindre la première.
    startsAt: dans(30),
    endsAt: dans(44),
    bannerText: 'Tabaski : offrez une part de viande à une famille qui n’en aura pas.',
    ctaLabel: 'Offrir une part',
    ctaUrl: '/communaute/donateur',
    goal: 120,
    greeting: 'عيد أضحى مبارك',
    greetingLatin: 'Tabaski Moubarak',
    pillLabel: 'Aïd al-Adha',
    heroTitle: 'Tabaski Moubarak',
    heroLead:
      'La fête du sacrifice est d’abord une fête du partage. Offrez une part de viande à une famille qui n’en aura pas : nous organisons l’abattage, la découpe et la distribution dans quatre quartiers.',
    secondaryLabel: 'C’est quoi la Tabaski',
    secondaryUrl: '/programmes/evenements',
    progressUnit: 'parts',
    progressCurrent: 68,
    figures: ['4|quartiers couverts', '6|jours avant la fête'],
    offers: [
      'Une part|15000|Une famille de cinq personnes reçoit sa part le jour de la fête.',
      'Un mouton entier*|95000|Sept parts distribuées, photos et compte rendu envoyés au donateur.',
      'Montant libre||Cumulé avec d’autres dons pour compléter une part.',
    ],
    marquee: ['Parts de Tabaski', 'Abattage encadré', 'Distribution en quatre quartiers'],
    // La bande basse annonce l'heure de rupture du jeûne : elle n'a pas
    // d'équivalent à la Tabaski.
    dailyEnabled: false,
    isActive: false,
  },
];

export async function seedCampagnes(prisma: PrismaClient): Promise<number> {
  for (const campagne of CAMPAGNES) {
    const { isActive, ...contenu } = campagne;

    await prisma.seasonalCampaign.upsert({
      where: { slug: campagne.slug },
      // À la mise à jour, on ne touche pas à `isActive` : l'association reste
      // maîtresse de ce qui est allumé.
      update: contenu,
      create: { ...contenu, isActive },
    });
  }

  return prisma.seasonalCampaign.count();
}
