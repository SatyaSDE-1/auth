// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    name: process.env.DB_NAME ?? 'auth_db',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'access-secret-change-in-prod',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret-change-in-prod',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    accessExpiresInSeconds: parseInt(process.env.JWT_ACCESS_EXPIRES_SECONDS ?? '900', 10),
    refreshExpiresInSeconds: parseInt(process.env.JWT_REFRESH_EXPIRES_SECONDS ?? '604800', 10),
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
    ttl: parseInt(process.env.REDIS_TTL ?? '604800', 10),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? '',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  },
});