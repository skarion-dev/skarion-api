import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const createCourseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  slug: z.string().optional(),
  price: z.number().int().positive(),
  currency: z.string().default('usd'),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
});

export class CreateCourseDto extends createZodDto(createCourseSchema) {}

export class CourseResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false, nullable: true })
  description?: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ required: false, nullable: true })
  slug?: string;

  @ApiProperty({ required: false, nullable: true })
  imageUrl?: string;

  @ApiProperty({ required: false, nullable: true })
  videoUrl?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
