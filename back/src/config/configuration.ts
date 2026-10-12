export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  storage: {
    endpoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    publicUrl: string;
    /**
     * Région de signature. Vide en MinIO ; `auto` sur Cloudflare R2, qui
     * refuse les requêtes signées pour une autre région.
     */
    region: string;
    /**
     * Nom d'un **unique** seau où tout est rangé, les huit usages devenant
     * des préfixes de clé.
     *
     * MinIO laisse ce réglage vide et garde un seau par usage, comme prévu au
     * cahier des charges. R2, lui, publie une adresse de lecture **par seau** :
     * huit seaux donneraient huit adresses publiques différentes, alors que le
     * site n'en connaît qu'une. Un seau et huit préfixes produisent exactement
     * les mêmes adresses de fichiers, sans rien changer en base.
     */
    bucket: string;
    /**
     * Le stockage accepte-t-il qu'on lui pose une police de lecture publique ?
     *
     * MinIO oui ; R2 non — il n'implémente pas `PutBucketPolicy`, et l'accès
     * public s'y ouvre depuis le tableau de bord, par adresse publique ou
     * domaine personnalisé. Tenter de la poser faisait échouer l'amorçage.
     */
    canSetPolicy: boolean;
  };
  sentryDsn: string;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '4100', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3100')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  storage: {
    endpoint: process.env.S3_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.S3_PORT ?? '9000', 10),
    useSSL: process.env.S3_USE_SSL === 'true',
    accessKey: process.env.S3_ACCESS_KEY ?? 'sadaqa',
    secretKey: process.env.S3_SECRET_KEY ?? 'sadaqa-minio',
    publicUrl: process.env.S3_PUBLIC_URL ?? 'http://localhost:9000',
    region: process.env.S3_REGION ?? '',
    bucket: process.env.S3_BUCKET ?? '',
    // Par défaut oui, pour ne rien changer au comportement MinIO existant.
    // On la désactive explicitement sur R2.
    canSetPolicy: process.env.S3_SET_POLICY !== 'false',
  },
  sentryDsn: process.env.SENTRY_DSN ?? '',
});
