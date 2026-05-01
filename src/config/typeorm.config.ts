import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Account } from 'src/entities/account.entity';
import { StripeEvent } from 'src/entities/stripe-event.entity';
import { Purchase } from 'src/entities/purchase.entity';
import { Course } from 'src/entities/course.entity';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { appConfig } from 'src/config/app-config';
import { FormResponse } from 'src/entities/form-response.entity';
import { Candidate } from 'src/entities/candidate.entity';
import { JobApplication } from 'src/entities/job-application.entity';
import { Job } from '../entities/job.entity';
import { CrawlerStatus } from 'src/entities/crawler-status.entity';

export const ormConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',

  host: appConfig.env.DB_HOST,
  port: Number(appConfig.env.DB_PORT) || 5432,
  username: appConfig.env.DB_USER,
  password: appConfig.env.DB_PASSWORD,
  database: appConfig.env.DB_NAME,

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
    Job,
    CrawlerStatus,
  ],

  // synchronize: appConfig.env.NODE_ENV !== 'production',
  synchronize: true,
  logging: appConfig.env.NODE_ENV !== 'production',

  ssl: appConfig.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,

  extra: {
    ...(appConfig.env.NODE_ENV === 'production' && {
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  },
});
