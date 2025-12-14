import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const signupSchema = z
  .object({
    username: z.string().min(3),
    name: z.string().min(4),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export class SignupDto extends createZodDto(signupSchema) {}

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class LoginDto extends createZodDto(loginSchema) {}

export const oauthLoginSchema = z.object({
  provider: z.string(),
  providerAccountId: z.string(),
  profile: z.record(z.string(), z.any()),
});

export class OauthLoginDto extends createZodDto(oauthLoginSchema) {}
