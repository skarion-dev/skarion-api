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


  private buildUserResponse(user: User) {
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
      email: user.email,
      roles,
      permissions,
      image: user.image,
      lastLogin: user.lastLogin,
      referralCode: user.referralCode,
      accessToken,
    };
  }

  async signup(signupDto: SignupDto) {
    const { username, name, email, password, confirmPassword } = signupDto;

    if (!name || !email || !password || !confirmPassword)
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

    let user;

    if (account) {
      user = account.user;
    } else {
      // Try to match existing email
      user = profile['email']
        ? await this.userRepo.findOne({ 
            where: { email: profile['email'] },
            relations: ['roles', 'roles.permissions']
          })
        : null;

      if (!user) {
        const userRole = await this.roleRepo.findOne({ where: { name: 'user' } });
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
