import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { JobApplication } from './job-application.entity';

@Entity('candidates')
export class Candidate extends BaseEntity {
  @Column()
  name: string;

  @OneToMany(() => JobApplication, (app) => app.candidate, { cascade: true })
  applications: JobApplication[];
}
