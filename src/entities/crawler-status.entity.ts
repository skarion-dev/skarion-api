import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('crawler_status')
export class CrawlerStatus extends BaseEntity {
  @Column({ unique: true })
  crawlerName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastHeartbeatAt?: Date;

  @Column({ nullable: true })
  message?: string;
}
