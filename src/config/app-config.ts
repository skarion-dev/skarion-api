import { z, ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(5001),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_AUTHORIZED_PARTIES: z.string().optional(),
  AUTH_SECRET: z.string(),
  STRIPE_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // JWT_TTL: z.coerce.number().default(86400),
  // REDIS_HOST: z.string().default("localhost"),
  // REDIS_PORT: z.coerce.number().default(6379),
  // REDIS_PASSWORD: z.string().optional(),
  // MAILER_HOST: z.string().default("localhost"),
  // MAILER_PORT: z.coerce.number().default(587),
  // MAILER_SECURE: z.coerce.boolean().default(false),
  // MAILER_USER: z.string().optional(),
  // MAILER_PASSWORD: z.string().optional(),
  // MAILER_FROM: z.string().default("noreply@nite-feeder.com"),
  // PLATFORM_FEE: z.coerce.number().default(1),
});

export type AppConfig = z.infer<typeof envSchema>;

const validateAndStoreEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof ZodError)
      throw new Error(`ENV ${fromZodError(error).message}`);
    throw error;
  }
};

export const appConfig = {
  env: validateAndStoreEnv(),
};
