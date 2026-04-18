import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateUserAffiliateSchema = z.object({
  referralCode: z.string().min(3, 'Referral code must be at least 3 characters long'),
});

export class UpdateUserAffiliateDto extends createZodDto(updateUserAffiliateSchema) {}
