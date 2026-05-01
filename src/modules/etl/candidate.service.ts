import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from '../../entities/candidate.entity';
import { CreateCandidateDto } from './dtos';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
  ) {}

  async create(dto: CreateCandidateDto) {
    const candidate = this.candidateRepo.create(dto);
    return this.candidateRepo.save(candidate);
  }

  async findAll() {
    return this.candidateRepo.find({ order: { createdAt: 'DESC' } });
  }
}
