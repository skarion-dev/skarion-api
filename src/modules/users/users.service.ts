import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { Candidate } from '../../entities/candidate.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
  ) {}

  async findAll() {
    return this.userRepository.find({
      select: ['id', 'name', 'username', 'email', 'image', 'isActive', 'referralCode', 'createdAt'],
      relations: ['roles'],
    });
  }

  async makeAffiliate(userId: string, referralCode: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingCode = await this.userRepository.findOne({ where: { referralCode } });
    if (existingCode && existingCode.id !== user.id) {
      throw new BadRequestException('Referral code is already in use by another user');
    }

    const affiliateRole = await this.roleRepository.findOne({ where: { name: 'affiliate_user' } });

    if (!affiliateRole) {
      throw new NotFoundException('Affiliate role not found in database. Please run migrations.');
    }

    // Attach role if not already attached
    if (!user.roles.some((role) => role.name === 'affiliate_user')) {
      user.roles.push(affiliateRole);
    }

    user.referralCode = referralCode;

    await this.userRepository.save(user);

    return { message: 'User upgraded to affiliate safely', user };
  }

  async assignCandidateRole(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Guard: already a candidate
    if (user.roles.some((r) => r.name === 'candidate')) {
      throw new BadRequestException('User is already a candidate');
    }

    const candidateRole = await this.roleRepository.findOne({ where: { name: 'candidate' } });
    if (!candidateRole) {
      throw new NotFoundException('Candidate role not found. Please run migrations.');
    }

    // Attach the candidate role
    user.roles.push(candidateRole);
    await this.userRepository.save(user);

    // Upsert a Candidate record linked to this user
    let candidate = await this.candidateRepository.findOne({ where: { userId: user.id } });
    if (!candidate) {
      candidate = this.candidateRepository.create({
        name: user.name || user.username,
        userId: user.id,
      });
      await this.candidateRepository.save(candidate);
    }

    return { message: 'User assigned candidate role successfully', user, candidate };
  }
}
