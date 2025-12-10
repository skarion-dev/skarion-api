import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { Account } from 'src/entities/account.entity';
import { User } from 'src/entities/user.entity';
import { DatabaseModule } from 'src/database/database.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Account])],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
