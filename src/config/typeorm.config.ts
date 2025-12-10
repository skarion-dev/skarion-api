import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { appConfig } from 'src/config/app-config';
import { Account } from 'src/entities/account.entity';

export const ormConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: appConfig.env.DB_HOST || 'localhost',
  port: Number(appConfig.env.DB_PORT) || 5432,
  username: appConfig.env.DB_USER || 'postgres',
  password: appConfig.env.DB_PASSWORD || 'postgres',
  database: appConfig.env.DB_NAME || 'mydb',
  entities: [User, Account],
  synchronize: true,
  migrationsRun: false,
  logging: true,
  migrations: ['src/database/migrations/*.js'],
});
