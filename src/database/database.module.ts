import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormConfig } from '../config/typeorm.config';
@Module({
  imports: [TypeOrmModule.forRootAsync({ useFactory: ormConfig })],
})
export class DatabaseModule {}
