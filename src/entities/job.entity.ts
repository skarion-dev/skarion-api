import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('jobs')
export class Job extends BaseEntity {
  @Column()
  title: string;

  @Column()
  company: string;

  @Column()
  link: string;

  @Column({ unique: true })
  externalId: string; 

  @Column({ type: 'timestamp', nullable: true })
  postedAt: Date;

  @Column({ nullable: true })
  platform?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  employmentType?: string;

  @Column({ nullable: true })
  workplaceType?: string;

  @Column({ nullable: true })
  sourceUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}
