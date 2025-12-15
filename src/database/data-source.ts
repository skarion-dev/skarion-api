import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Account } from '../entities/account.entity';
import { StripeEvent } from '../entities/stripe-event.entity';
import { User } from '../entities/user.entity';
import { Purchase } from '../entities/purchase.entity';
import { Course } from '../entities/course.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'mydb',
  entities: [User, Account, StripeEvent, Purchase, Course],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
  logging: true,
  synchronize: false,
});
