import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { CourseResponse } from '../courses/dtos';

export const createCheckoutSchema = z.object({
  email: z.email(),
  courseId: z.string(),
});

export class CreateCheckoutDto extends createZodDto(createCheckoutSchema) {}

export class CheckoutResponse {
  @ApiProperty({ description: 'Checkout session URL' })
  url: string;

  @ApiProperty({ description: 'Stripe session ID' })
  sessionId: string;
}

export class WebhookResponse {
  @ApiProperty({ example: true })
  received: boolean;
}

export class PurchaseResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  courseId: string;

  @ApiProperty({ type: () => CourseResponse })
  course: CourseResponse;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  stripeSessionId?: string;

  @ApiProperty({ required: false })
  customerEmail?: string;

  @ApiProperty()
  createdAt: Date;
}
