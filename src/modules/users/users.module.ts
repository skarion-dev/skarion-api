import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { Candidate } from '../../entities/candidate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Candidate])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
