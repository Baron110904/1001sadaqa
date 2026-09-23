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
  },
  sentryDsn: process.env.SENTRY_DSN ?? '',
});
