import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { Account } from 'src/entities/account.entity';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { AuthController } from './auth.controller';
import { appConfig } from 'src/config/app-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account, Role, Permission]),
    JwtModule.register({
      secret: appConfig.env.AUTH_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
