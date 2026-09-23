import {
  ContactStatus,
  DonationMethod,
  DonationStatus,
  FoodbankRequestKind,
  FoodbankRequestStatus,
  MemberStatus,
  PrismaClient,
  VolunteerStatus,
} from '@prisma/client';

/**
 * Données de démonstration : ce qui remplit le back-office.
 *
 * Le seed pose le **contenu** de l'association — programmes, projets,
 * actualités. Ce fichier pose ce qui arrive **par les formulaires** : des
 * messages, des adhésions, des dons. Sans eux, le tableau de bord n'affiche
 * que des zéros et les écrans de traitement sont vides, ce qui donne d'un
 * site pourtant complet l'image d'un site mort.
 *
 * Les noms sont plausibles et béninois, les adresses en `@exemple.bj` — un
 * domaine réservé à la documentation, qui ne peut atteindre personne. Aucune
 * de ces personnes n'existe.
 *
 * Réentrant : chaque enregistrement est reconnu à son adresse et mis à jour
 * plutôt que dupliqué. Relancer le script ne gonfle pas les compteurs.
 */

const jours = (n: number) => new Date(Date.now() - n * 86_400_000);

const MESSAGES = [
  {
    name: 'Rachidatou ADJOVI',
    email: 'r.adjovi@exemple.bj',
    phone: '+229 97 12 45 80',
    subject: 'Distribution de vivres à Fidjrossè',
    message:
      'Bonjour, je souhaite savoir comment inscrire ma voisine, veuve et mère de quatre enfants, aux distributions de votre banque alimentaire. Merci pour votre travail.',
    status: ContactStatus.PENDING,
    createdAt: jours(1),
  },
  {
    name: 'Ibrahim SOULEYMANE',
    email: 'i.souleymane@exemple.bj',
    phone: '+229 96 33 77 12',
    subject: 'Proposition de don de matériel scolaire',
    message:
      'Notre librairie dispose d’un stock de cahiers et de fournitures invendus. Nous aimerions les remettre à l’association avant la rentrée.',
    status: ContactStatus.READ,
    createdAt: jours(4),
  },
  {
    name: 'Christelle HOUNKPATIN',
    email: 'c.hounkpatin@exemple.bj',
    phone: null,
    subject: 'Demande de reçu fiscal',
    message:
      'J’ai effectué un don le mois dernier et je n’ai pas reçu de reçu. Pourriez-vous me l’adresser ? Merci d’avance.',
    status: ContactStatus.REPLIED,
    createdAt: jours(11),
  },
];

const BENEVOLES = [
  {
    name: 'Mariam TIDJANI',
    email: 'm.tidjani@exemple.bj',
    phone: '+229 95 40 18 62',
    availability: 'Samedis et dimanches matin',
    skills: ['Distribution', 'Accueil'],
    message: 'Étudiante en soins infirmiers, je peux aider aux consultations foraines.',
    status: VolunteerStatus.ACTIVE,
    createdAt: jours(30),
  },
  {
    name: 'Serge AGOSSOU',
    email: 's.agossou@exemple.bj',
    phone: '+229 66 21 09 47',
    availability: 'En soirée, en semaine',
    skills: ['Logistique', 'Conduite'],
    message: 'Je dispose d’un véhicule utilitaire pour les transports de denrées.',
    status: VolunteerStatus.CONTACTED,
    createdAt: jours(6),
  },
  {
    name: 'Bénédicte KOUTON',
    email: 'b.kouton@exemple.bj',
    phone: '+229 97 88 30 55',
    availability: 'Deux après-midis par semaine',
    skills: ['Alphabétisation', 'Suivi administratif'],
    message: 'Enseignante à la retraite, je souhaite accompagner les ateliers.',
    status: VolunteerStatus.PENDING,
    createdAt: jours(2),
  },
];

const MEMBRES = [
  {
    name: 'Nadège AHOUANDJINOU',
    email: 'n.ahouandjinou@exemple.bj',
    phone: '+229 97 05 63 21',
    city: 'Cotonou',
    profession: 'Comptable',
    interests: ['Sécurité alimentaire', 'Éducation'],
    participation: ['Cotisation', 'Terrain'],
    pledgedAmount: 5000,
    status: MemberStatus.ACTIF,
    joinedAt: jours(120),
    createdAt: jours(122),
  },
  {
    name: 'Kossi DOSSOU',
    email: 'k.dossou@exemple.bj',
    phone: '+229 96 74 12 08',
    city: 'Porto-Novo',
    profession: 'Ingénieur agronome',
    interests: ['Sécurité alimentaire'],
    participation: ['Cotisation', 'Compétences'],
    pledgedAmount: 10000,
    status: MemberStatus.ACTIF,
    joinedAt: jours(64),
    createdAt: jours(66),
  },
  {
    name: 'Fatima BIO TCHANÉ',
    email: 'f.biotchane@exemple.bj',
    phone: '+229 95 29 84 73',
    city: 'Parakou',
    profession: 'Sage-femme',
    interests: ['Santé', 'Mère & enfant'],
    participation: ['Compétences'],
    pledgedAmount: 2000,
    status: MemberStatus.EN_ATTENTE,
    joinedAt: null,
    createdAt: jours(3),
  },
];

const DONS = [
  {
    donorName: 'Aristide ZINSOU',
    donorEmail: 'a.zinsou@exemple.bj',
    donorPhone: '+229 97 61 20 44',
    donorCountry: 'Bénin',
    donorCity: 'Cotonou',
    amount: 50000,
    method: DonationMethod.MOBILE_MONEY,
    status: DonationStatus.COMPLETED,
    isAnonymous: false,
    createdAt: jours(9),
  },
  {
    donorName: 'Sylvie AKPOVI',
    donorEmail: 's.akpovi@exemple.bj',
    donorPhone: null,
    donorCountry: 'France',
    donorCity: 'Paris',
    amount: 25000,
    method: DonationMethod.CARD,
    status: DonationStatus.COMPLETED,
    isAnonymous: false,
    createdAt: jours(17),
  },
  {
    donorName: 'Moussa GARBA',
    donorEmail: 'm.garba@exemple.bj',
    donorPhone: '+229 66 40 55 19',
    donorCountry: 'Bénin',
    donorCity: 'Djougou',
    amount: 10000,
    method: DonationMethod.MOBILE_MONEY,
    status: DonationStatus.COMPLETED,
    isAnonymous: false,
    createdAt: jours(22),
  },
  {
    // Un don anonyme, pour que le classement public prouve qu'il l'écarte.
    donorName: 'Hélène TOSSOU',
    donorEmail: 'h.tossou@exemple.bj',
    donorPhone: null,
    donorCountry: 'Bénin',
    donorCity: 'Abomey-Calavi',
    amount: 15000,
    method: DonationMethod.MOBILE_MONEY,
    status: DonationStatus.COMPLETED,
    isAnonymous: true,
    createdAt: jours(5),
  },
  {
    donorName: 'Yacine OROU',
    donorEmail: 'y.orou@exemple.bj',
    donorPhone: '+229 97 33 71 26',
    donorCountry: 'Bénin',
    donorCity: 'Parakou',
    amount: 5000,
    method: DonationMethod.MOBILE_MONEY,
    status: DonationStatus.PENDING,
    isAnonymous: false,
    createdAt: jours(1),
  },
];

const PARTENARIATS = [
  {
    organisation: 'Pharmacie du Lac',
    contactName: 'Dr Léonard AÏVODJI',
    email: 'contact@exemple.bj',
    phone: '+229 21 30 44 10',
    intent:
      'Nous souhaitons fournir gratuitement des médicaments de première nécessité pour vos consultations foraines.',
    status: ContactStatus.PENDING,
    createdAt: jours(2),
  },
  {
    organisation: 'Coopérative agricole de Bohicon',
    contactName: 'Prosper AGBODJAN',
    email: 'coop@exemple.bj',
    phone: '+229 95 17 62 38',
    intent:
      'Nous produisons du maïs et du niébé et pouvons approvisionner la banque alimentaire chaque trimestre.',
    status: ContactStatus.READ,
    createdAt: jours(13),
  },
];

const MOTS = [
  {
    authorName: 'Georgette AKPO',
    isAnonymous: false,
    message:
      'Depuis trois mois, les paniers de la banque nous permettent de tenir jusqu’à la fin du mois. Mes enfants mangent à leur faim.',
    isPublished: true,
    createdAt: jours(8),
  },
  {
    authorName: 'Un bénéficiaire',
    isAnonymous: true,
    message:
      'J’ai été reçu sans qu’on me fasse sentir que je demandais la charité. C’est ce qui m’a le plus marqué.',
    isPublished: true,
    createdAt: jours(20),
  },
  {
    authorName: 'Estelle DANSOU',
    isAnonymous: false,
    // Non publié : l'écran de modération du back-office doit avoir de quoi
    // montrer ce qu'il fait.
    message: 'Merci beaucoup pour l’aide apportée à ma famille pendant le Ramadan.',
    isPublished: false,
    createdAt: jours(1),
  },
];

export async function seedDemo(prisma: PrismaClient): Promise<Record<string, number>> {
  for (const message of MESSAGES) {
    const existant = await prisma.contact.findFirst({ where: { email: message.email } });
    if (existant) await prisma.contact.update({ where: { id: existant.id }, data: message });
    else await prisma.contact.create({ data: message });
  }

  for (const benevole of BENEVOLES) {
    const existant = await prisma.volunteer.findFirst({ where: { email: benevole.email } });
    if (existant) await prisma.volunteer.update({ where: { id: existant.id }, data: benevole });
    else await prisma.volunteer.create({ data: benevole });
  }

  for (const membre of MEMBRES) {
    const existant = await prisma.member.findFirst({ where: { email: membre.email } });
    if (existant) await prisma.member.update({ where: { id: existant.id }, data: membre });
    else await prisma.member.create({ data: membre });
  }

  for (const don of DONS) {
    const existant = await prisma.donation.findFirst({ where: { donorEmail: don.donorEmail } });
    if (existant) await prisma.donation.update({ where: { id: existant.id }, data: don });
    else await prisma.donation.create({ data: don });
  }

  for (const demande of PARTENARIATS) {
    const existant = await prisma.partnershipRequest.findFirst({ where: { email: demande.email } });
    if (existant)
      await prisma.partnershipRequest.update({ where: { id: existant.id }, data: demande });
    else await prisma.partnershipRequest.create({ data: demande });
  }

  for (const mot of MOTS) {
    const existant = await prisma.foodbankComment.findFirst({
      where: { authorName: mot.authorName },
    });
    if (existant) await prisma.foodbankComment.update({ where: { id: existant.id }, data: mot });
    else await prisma.foodbankComment.create({ data: mot });
  }

  // ── Banque alimentaire : une demande de chaque sorte ──
  //
  // L'apport validé est le seul qui écrit au stock. On ne le rejoue donc pas :
  // sinon chaque relance du seed gonflerait la réserve d'autant.
  const categorie = await prisma.foodCategory.findFirst({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  if (categorie) {
    const apport = {
      kind: FoodbankRequestKind.DON,
      name: 'Raïmi LAWANI',
      email: 'r.lawani@exemple.bj',
      phone: '+229 97 44 12 90',
      categoryId: categorie.id,
      quantity: 80,
      unit: categorie.unit,
      message: 'Sacs de 25 kg, à retirer à la boutique.',
      createdAt: jours(2),
    };
    const dejaLa = await prisma.foodbankRequest.findFirst({ where: { email: apport.email } });
    if (!dejaLa) await prisma.foodbankRequest.create({ data: apport });

    const retrait = {
      kind: FoodbankRequestKind.RETRAIT,
      name: 'Clarisse VIGAN',
      email: 'c.vigan@exemple.bj',
      phone: '+229 96 08 51 33',
      categoryId: categorie.id,
      quantity: 10,
      unit: categorie.unit,
      message: 'Famille de six personnes, quartier Vèdoko.',
      status: FoodbankRequestStatus.PENDING,
      createdAt: jours(1),
    };
    const retraitLa = await prisma.foodbankRequest.findFirst({ where: { email: retrait.email } });
    if (!retraitLa) await prisma.foodbankRequest.create({ data: retrait });
  }

  return {
    messages: await prisma.contact.count(),
    bénévoles: await prisma.volunteer.count(),
    membres: await prisma.member.count(),
    dons: await prisma.donation.count(),
    partenariats: await prisma.partnershipRequest.count(),
    'demandes banque': await prisma.foodbankRequest.count(),
    'mots banque': await prisma.foodbankComment.count(),
  };
}
