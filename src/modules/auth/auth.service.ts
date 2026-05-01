import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/entities/user.entity';
import { Account } from 'src/entities/account.entity';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { SignupDto, LoginDto, OauthLoginDto } from './dtos';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
    private jwtService: JwtService,
  ) {}


  private buildUserResponse(user: User, needsUsername = false) {
    const permissions = user.roles
      ?.flatMap((r) => r.permissions?.map((p) => p.name) || [])
      .filter((value, index, self) => self.indexOf(value) === index) || [];

    const roles = user.roles?.map((r) => r.name) || [];

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roles,
      permissions,
    });

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      roles,
      permissions,
      image: user.image,
      lastLogin: user.lastLogin,
      referralCode: user.referralCode,
      accessToken,
      needsUsername,
    };
  }

  async signup(signupDto: SignupDto) {
    const { username, name, email, password, confirmPassword } = signupDto;

    if (!username || !name || !email || !password || !confirmPassword)
      throw new UnauthorizedException('Missing required fields');

    if (password !== confirmPassword)
      throw new UnauthorizedException('Passwords do not match');

    const existingEmail = await this.userRepo.findOne({ where: { email } });
    if (existingEmail) throw new UnauthorizedException('Email already exists');

    const existingUsername = await this.userRepo.findOne({
      where: { username },
    });
    if (existingUsername)
      throw new UnauthorizedException('Username already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = await this.roleRepo.findOne({ where: { name: 'user' } });

    const user = this.userRepo.create({
      username,
      name,
      email,
      password: hashedPassword,
    });

    if (userRole) {
      user.roles = [userRole];
    }

    await this.userRepo.save(user);

    const savedUser = (await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.permissions'],
    })) as User;

    return this.buildUserResponse(savedUser);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userRepo.findOne({ 
      where: { email },
      relations: ['roles', 'roles.permissions']
    });

    if (!user || !user.password)
      throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    user.lastLogin = new Date();
    await this.userRepo.save(user);

    return this.buildUserResponse(user);
  }

  async oauthLogin(oauthLoginDto: OauthLoginDto) {
    const { provider, providerAccountId, profile } = oauthLoginDto;
    const account = await this.accountRepo.findOne({
      where: { provider, providerAccountId },
      relations: ['user', 'user.roles', 'user.roles.permissions'],
    });

    let user: User;
    let needsUsername = false;

    if (account) {
      user = account.user;
      if (!user.username) needsUsername = true;
    } else {
      // Try to match existing email
      const foundUser = profile['email']
        ? await this.userRepo.findOne({ 
            where: { email: profile['email'] },
            relations: ['roles', 'roles.permissions']
          })
        : null;
      user = foundUser as User;

      if (!user) {
        const userRole = await this.roleRepo.findOne({ where: { name: 'user' } });
        // Create OAuth user WITHOUT a username — they must set one before accessing the app
        user = this.userRepo.create({
          name: profile['name'],
          email: profile['email'],
          image: profile['image'],
          emailVerifiedAt: new Date(),
        });
        if (userRole) {
          user.roles = [userRole];
        }
        await this.userRepo.save(user);
        needsUsername = true;
      } else if (!user.username) {
        // Existing user without a username — flag it
        needsUsername = true;
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

    const savedUser = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.permissions'],
    }) as User;

    return this.buildUserResponse(savedUser, needsUsername);
  }

  async setUsername(userId: string, username: string) {
    if (!username || username.length < 3)
      throw new UnauthorizedException('Username must be at least 3 characters');

    const existing = await this.userRepo.findOne({ where: { username } });
    if (existing && existing.id !== userId)
      throw new UnauthorizedException('Username already taken');

    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) throw new UnauthorizedException('User not found');

    user.username = username;
    await this.userRepo.save(user);

    return this.buildUserResponse(user, false);
  }
}
