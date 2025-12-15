import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Purchase } from './purchase.entity';

@Entity('courses')
export class Course extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'integer' })
  price: number;

  @Column({ default: 'usd' })
  currency: string;

  @Column({ nullable: true })
  imageUrl: string;

  @OneToMany(() => Purchase, (purchase) => purchase.course)
  purchases: Purchase[];
}
