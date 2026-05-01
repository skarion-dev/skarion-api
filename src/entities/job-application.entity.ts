import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Candidate } from './candidate.entity';
import { User } from './user.entity';

@Entity('job_applications')
export class JobApplication extends BaseEntity {
  @Column('uuid')
  candidateId: string;

  @ManyToOne(() => Candidate, (candidate) => candidate.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column()
  companyName: string;

  @Column()
  jobRole: string;

  @Column({ nullable: true })
  jobUrl?: string;

  @Column({ nullable: true })
  workplaceType?: string;

  @Column({ nullable: true })
  contractType?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  platform?: string;

  @Column({ nullable: true })
  status?: string;

  @Column({ default: false })
  shortlisted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  interviewScheduled?: Date;

  @Column({ nullable: true })
  resumeUrl?: string;

  @Column({ nullable: true })
  resumeFileName?: string;

  @Column({ type: 'timestamp', nullable: true })
  applicationDate?: Date;

  @Column('uuid', { nullable: true })
  appliedById?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appliedById' })
  appliedBy?: User;

  @Column({ type: 'jsonb', default: [] })
  comments: any[];
}
