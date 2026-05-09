import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { JobApplication } from './job-application.entity';
import { User } from './user.entity';

@Entity('candidates')
export class Candidate extends BaseEntity {
  @Column()
  name: string;

  /** The user account this candidate is linked to (set when admin assigns the candidate role). */
  @Column('uuid', { nullable: true, unique: true })
  userId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @OneToMany(() => JobApplication, (app) => app.candidate, { cascade: true })
  applications: JobApplication[];
}

