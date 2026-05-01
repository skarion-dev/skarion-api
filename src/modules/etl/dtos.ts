import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createCandidateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export class CreateCandidateDto extends createZodDto(createCandidateSchema) {}

/** Typed schema for a single comment/reply stored in the jsonb array */
export const commentSchema = z.object({
  id: z.string(),
  text: z.string(),
  author: z.string(),
  authorId: z.string().optional(),
  timestamp: z.string(),
  parentId: z.string().optional(),   // set on replies — links to parent comment id
});

export const createJobApplicationSchema = z.object({
  candidateId: z.string().uuid(),
  companyName: z.string().min(1),
  jobRole: z.string().min(1),
  jobUrl: z.string().optional(),
  workplaceType: z.string().optional(),
  contractType: z.string().optional(),
  location: z.string().optional(),
  platform: z.string().optional(),
  status: z.string().optional(),
  shortlisted: z.boolean().default(false),
  interviewScheduled: z.string().optional(),
  applicationDate: z.string().optional(),
  resumeUrl: z.string().optional(),
  resumeFileName: z.string().optional(),
  comments: z.array(commentSchema).default([]),
});

export class CreateJobApplicationDto extends createZodDto(createJobApplicationSchema) {}

export const updateJobApplicationSchema = createJobApplicationSchema.partial();
export class UpdateJobApplicationDto extends createZodDto(updateJobApplicationSchema) {}
