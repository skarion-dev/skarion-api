import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/entities/user.entity';
import { Account } from 'src/entities/account.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    private jwtService: JwtService,
  ) {}

  private buildUserResponse(user: User) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      lastLogin: user.lastLogin,
      accessToken,
    };
  }

  async signup(
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) {
    if (!name || !email || !password || !confirmPassword)
      throw new UnauthorizedException('Missing required fields');

    if (password !== confirmPassword)
      throw new UnauthorizedException('Passwords do not match');

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new UnauthorizedException('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      name,
      email,
      password: hashedPassword,
    });

    await this.userRepo.save(user);

    return this.buildUserResponse(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user || !user.password)
      throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    user.lastLogin = new Date();
    await this.userRepo.save(user);

    return this.buildUserResponse(user);
  }

  async oauthLogin(provider: string, providerAccountId: string, profile: any) {
    const account = await this.accountRepo.findOne({
      where: { provider, providerAccountId },
      relations: ['user'],
    });

    let user;

    if (account) {
      user = account.user;
    } else {
      // Try to match existing email
      user = profile.email
        ? await this.userRepo.findOne({ where: { email: profile.email } })
        : null;

      if (!user) {
        user = this.userRepo.create({
          name: profile.name,
          email: profile.email,
          image: profile.image,
          emailVerifiedAt: new Date(),
        });
        await this.userRepo.save(user);
      }

      const newAccount = this.accountRepo.create({
        provider,
        providerAccountId,
        type: 'oauth',
        user,
      });

      await this.accountRepo.save(newAccount);
    }

    user.lastLogin = new Date();
    await this.userRepo.save(user);

    return this.buildUserResponse(user);
  }
}
