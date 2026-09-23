import { Injectable, type OnModuleInit } from '@nestjs/common';
import { DonationMethod, Prisma, SettingGroup } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_SETTINGS,
  PAYMENT_KEYS,
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from './settings.constants';

export interface PaymentConfig {
  enabled: boolean;
  provider: PaymentProvider;
  sandbox: boolean;
  methods: DonationMethod[];
  publicKey: string;
  /**
   * Ne sort jamais du serveur : `findPublic` choisit ses champs un par un et
   * ne reprend pas celui-ci. Il n'est ici que pour signer les appels à
   * FedaPay, faits depuis l'API.
   */
  secretKey: string;
  /** Secret de signature des webhooks ; vide tant qu'il n'est pas renseigné. */
  webhookSecret: string;
  mobileMoneyInstructions: string;
  bankDetails: string;
}

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Un paramètre déclaré ici doit exister en base, toujours.
   *
   * Le back-office n'affiche que les lignes présentes : une clé ajoutée après
   * le dernier amorçage restait donc invisible, et donc non renseignable.
   * C'est arrivé au compte TikTok. Rejouer le seed corrigerait la clé mais
   * réécrirait aussi les contenus de démonstration — impensable sur une base
   * en service. La réconciliation est donc faite au démarrage : elle ne crée
   * que ce qui manque et ne touche jamais à une valeur saisie.
   */
  async onModuleInit(): Promise<void> {
    await this.ensureDefaults();
  }

  /** Paramètres exposés au site public : jamais les valeurs secrètes. */
  async findPublic(): Promise<Record<string, unknown>> {
    const settings = await this.prisma.setting.findMany({
      where: { isSecret: false, group: { not: SettingGroup.PAYMENT } },
    });

    const payment = await this.getPaymentConfig();

    return {
      ...Object.fromEntries(settings.map((s) => [s.key, s.value])),
      payment: {
        enabled: payment.enabled,
        provider: payment.provider,
        methods: payment.methods,
        publicKey: payment.publicKey,
        mobileMoneyInstructions: payment.mobileMoneyInstructions,
        bankDetails: payment.bankDetails,
      },
    };
  }

  /** Vue back-office : les secrets sont remplacés par un indicateur de présence. */
  async findAllAdmin() {
    const settings = await this.prisma.setting.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    return settings.map((setting) =>
      setting.isSecret
        ? { ...setting, value: null, isSet: Boolean(setting.value) }
        : { ...setting, isSet: true },
    );
  }

  async update(key: string, value: Prisma.InputJsonValue) {
    const setting = await this.prisma.setting.update({ where: { key }, data: { value } });
    return setting.isSecret ? { ...setting, value: null, isSet: Boolean(value) } : setting;
  }

  async getPaymentConfig(): Promise<PaymentConfig> {
    const raw = await this.readMany(Object.values(PAYMENT_KEYS));

    const methods = Array.isArray(raw[PAYMENT_KEYS.methods])
      ? (raw[PAYMENT_KEYS.methods] as string[]).filter(
          (m): m is DonationMethod => m in DonationMethod,
        )
      : [DonationMethod.MOBILE_MONEY];

    return {
      enabled: raw[PAYMENT_KEYS.enabled] === true,
      provider: PAYMENT_PROVIDER,
      sandbox: raw[PAYMENT_KEYS.sandbox] !== false,
      methods: methods.length ? methods : [DonationMethod.MOBILE_MONEY],
      publicKey: (raw[PAYMENT_KEYS.publicKey] as string) ?? '',
      secretKey: (raw[PAYMENT_KEYS.secretKey] as string) ?? '',
      webhookSecret: (raw[PAYMENT_KEYS.webhookSecret] as string) ?? '',
      mobileMoneyInstructions: (raw[PAYMENT_KEYS.mobileMoneyInstructions] as string) ?? '',
      bankDetails: (raw[PAYMENT_KEYS.bankDetails] as string) ?? '',
    };
  }

  /** Crée les paramètres manquants sans écraser ceux déjà renseignés. */
  async ensureDefaults(): Promise<void> {
    for (const seed of DEFAULT_SETTINGS) {
      await this.prisma.setting.upsert({
        where: { key: seed.key },
        update: { group: seed.group, label: seed.label, isSecret: seed.isSecret ?? false },
        create: {
          key: seed.key,
          group: seed.group,
          label: seed.label,
          isSecret: seed.isSecret ?? false,
          value: seed.value as Prisma.InputJsonValue,
        },
      });
    }
  }

  private async readMany(keys: string[]): Promise<Record<string, unknown>> {
    const rows = await this.prisma.setting.findMany({ where: { key: { in: keys } } });
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }
}
