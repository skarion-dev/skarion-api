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
  CRAWLER_API_KEY: z.string().default('skarion-secret-api-key'),
  STRIPE_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_RETURN_URL: z
    .string()
    .optional()
    .default('http://skarion.com/course/outside-plant-engineering'),
  MS_CLIENT_ID: z.string().optional(),
  MS_CLIENT_SECRET: z.string().optional(),
  MS_TENANT_ID: z.string().optional(),
  DEFAULT_FROM_EMAIL: z.string().email().optional(),
  BOOKING_ORGANIZER_EMAIL: z.string().email().optional(),
  BOOKING_INTERNAL_NOTIFY_EMAIL: z.string().email().optional(),
  BOOKING_INTERNAL_NOTIFY_EMAILS: z.string().optional(),
  BOOKING_TIMEZONE: z.string().optional().default('America/New_York'),
  BOOKING_TIMEZONE_LABEL: z.string().optional().default('Eastern Time'),
  BOOKING_DURATION_MINUTES: z.coerce.number().optional().default(30),
  BOOKING_AVAILABILITY_DAYS: z.coerce.number().optional().default(30),
  BOOKING_MIN_LEAD_HOURS: z.coerce.number().optional().default(2),
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
