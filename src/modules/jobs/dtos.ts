import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string(),
  company: z.string(),
  link: z.string().url(),
  externalId: z.string(),
  postedAt: z.string().optional(),
  platform: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  workplaceType: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export class CreateJobDto extends createZodDto(createJobSchema) {}

export const crawlerHeartbeatSchema = z.object({
  crawlerName: z.string().min(1).default('job-radar'),
  isActive: z.boolean().default(true),
  message: z.string().optional(),
});

export class CrawlerHeartbeatDto extends createZodDto(crawlerHeartbeatSchema) {}
