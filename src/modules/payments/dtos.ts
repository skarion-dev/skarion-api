import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createCheckoutSchema = z.object({
  email: z.string().email().optional(),
});

export class CreateCheckoutDto extends createZodDto(createCheckoutSchema) {}
