import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Account } from '../entities/account.entity';
import { StripeEvent } from '../entities/stripe-event.entity';
import { User } from '../entities/user.entity';
import { Purchase } from '../entities/purchase.entity';
import { Course } from '../entities/course.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { FormResponse } from '../entities/form-response.entity';
import { Candidate } from '../entities/candidate.entity';
import { JobApplication } from '../entities/job-application.entity';
import { CrawlerStatus } from '../entities/crawler-status.entity';
import { Booking } from '../entities/booking.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'mydb',
  entities: [
    User,
    Account,
    StripeEvent,
    Purchase,
    Course,
    Role,
    Permission,
    FormResponse,
    Candidate,
    JobApplication,
    CrawlerStatus,
    Booking,
  ],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
  logging: true,
  synchronize: process.env.NODE_ENV !== 'production',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  extra: {
    ...(process.env.NODE_ENV === 'production' && {
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  },
});
