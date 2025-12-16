import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Account } from 'src/entities/account.entity';
import { StripeEvent } from 'src/entities/stripe-event.entity';
import { Purchase } from 'src/entities/purchase.entity';
import { Course } from 'src/entities/course.entity';
import { appConfig } from 'src/config/app-config';

export const ormConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',

  host: appConfig.env.DB_HOST,
  port: Number(appConfig.env.DB_PORT) || 5432,
  username: appConfig.env.DB_USER,
  password: appConfig.env.DB_PASSWORD,
  database: appConfig.env.DB_NAME,

  entities: [User, Account, StripeEvent, Purchase, Course],

  synchronize: appConfig.env.NODE_ENV !== 'production',
  logging: appConfig.env.NODE_ENV !== 'production',

  ssl: {
    rejectUnauthorized: false,
  },

  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
});
