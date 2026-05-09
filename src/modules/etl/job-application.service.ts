import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobApplication } from '../../entities/job-application.entity';
import { Candidate } from '../../entities/candidate.entity';
import { CreateJobApplicationDto, UpdateJobApplicationDto } from './dtos';

@Injectable()
export class JobApplicationService {
  constructor(
    @InjectRepository(JobApplication)
    private readonly jobAppRepo: Repository<JobApplication>,
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
  ) {}

  async create(userId: string, dto: CreateJobApplicationDto) {
    const jobApp = this.jobAppRepo.create({
      ...dto,
      appliedById: userId,
      interviewScheduled: dto.interviewScheduled ? new Date(dto.interviewScheduled) : undefined,
      applicationDate: dto.applicationDate ? new Date(dto.applicationDate) : new Date(),
    });
    const saved = await this.jobAppRepo.save(jobApp);
    // Reload with relations so the frontend immediately shows candidate/appliedBy
    return (
      (await this.jobAppRepo.findOne({
        where: { id: saved.id },
        relations: ['candidate', 'appliedBy'],
      })) ?? saved
    );
  }

  async findAll() {
    return this.jobAppRepo.find({
      relations: ['candidate', 'appliedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateJobApplicationDto) {
    const jobApp = await this.jobAppRepo.findOne({ where: { id } });
    if (!jobApp) {
      throw new NotFoundException('Job application not found');
    }

    Object.assign(jobApp, {
      ...dto,
      interviewScheduled: dto.interviewScheduled
        ? new Date(dto.interviewScheduled)
        : jobApp.interviewScheduled,
      applicationDate: dto.applicationDate
        ? new Date(dto.applicationDate)
        : jobApp.applicationDate,
    });
    await this.jobAppRepo.save(jobApp);
    // Reload with relations so the caller always gets a complete record
    return (
      (await this.jobAppRepo.findOne({
        where: { id },
        relations: ['candidate', 'appliedBy'],
      })) ?? jobApp
    );
  }

  async remove(id: string): Promise<void> {
    const jobApp = await this.jobAppRepo.findOne({ where: { id } });
    if (!jobApp) {
      throw new NotFoundException('Job application not found');
    }
    await this.jobAppRepo.remove(jobApp);
  }

  async getStats() {
    const totalCandidates = await this.candidateRepo.count();
    const totalApplications = await this.jobAppRepo.count();

    // By status
    const statusRaw = await this.jobAppRepo
      .createQueryBuilder('app')
      .select('app.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('app.status')
      .getRawMany<{ status: string | null; count: string }>();

    const byStatus: Record<string, number> = {};
    for (const row of statusRaw) {
      byStatus[row.status ?? 'Unknown'] = parseInt(row.count, 10);
    }

    // By day (last 30 days)
    const byDay = await this.jobAppRepo
      .createQueryBuilder('app')
      .select("TO_CHAR(app.applicationDate, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where("app.applicationDate >= NOW() - INTERVAL '30 days'")
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    // By month (last 12 months)
    const byMonth = await this.jobAppRepo
      .createQueryBuilder('app')
      .select("TO_CHAR(app.applicationDate, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where("app.applicationDate >= NOW() - INTERVAL '12 months'")
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany<{ month: string; count: string }>();

    // By year (all time)
    const byYear = await this.jobAppRepo
      .createQueryBuilder('app')
      .select("TO_CHAR(app.applicationDate, 'YYYY')", 'year')
      .addSelect('COUNT(*)', 'count')
      .where("app.applicationDate IS NOT NULL")
      .groupBy('year')
      .orderBy('year', 'ASC')
      .getRawMany<{ year: string; count: string }>();

    return {
      totalCandidates,
      totalApplications,
      byStatus,
      byDay: byDay.map((r) => ({ date: r.date, count: parseInt(r.count, 10) })),
      byMonth: byMonth.map((r) => ({ month: r.month, count: parseInt(r.count, 10) })),
      byYear: byYear.map((r) => ({ year: r.year, count: parseInt(r.count, 10) })),
    };
  }

  /** Returns all applications for a specific candidate ID (used by candidate dashboard). */
  async findForCandidate(candidateId: string) {
    return this.jobAppRepo.find({
      where: { candidateId },
      relations: ['candidate', 'appliedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Returns statistics scoped to a single candidate. */
  async getStatsForCandidate(candidateId: string) {
    const totalApplications = await this.jobAppRepo.count({ where: { candidateId } });

    const statusRaw = await this.jobAppRepo
      .createQueryBuilder('app')
      .select('app.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('app.candidateId = :candidateId', { candidateId })
      .groupBy('app.status')
      .getRawMany<{ status: string | null; count: string }>();

    const byStatus: Record<string, number> = {};
    for (const row of statusRaw) {
      byStatus[row.status ?? 'Unknown'] = parseInt(row.count, 10);
    }

    const byDay = await this.jobAppRepo
      .createQueryBuilder('app')
      .select("TO_CHAR(app.applicationDate, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('app.candidateId = :candidateId', { candidateId })
      .andWhere("app.applicationDate >= NOW() - INTERVAL '30 days'")
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    const byMonth = await this.jobAppRepo
      .createQueryBuilder('app')
      .select("TO_CHAR(app.applicationDate, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('app.candidateId = :candidateId', { candidateId })
      .andWhere("app.applicationDate >= NOW() - INTERVAL '12 months'")
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany<{ month: string; count: string }>();

    const byYear = await this.jobAppRepo
      .createQueryBuilder('app')
      .select("TO_CHAR(app.applicationDate, 'YYYY')", 'year')
      .addSelect('COUNT(*)', 'count')
      .where('app.candidateId = :candidateId', { candidateId })
      .andWhere('app.applicationDate IS NOT NULL')
      .groupBy('year')
      .orderBy('year', 'ASC')
      .getRawMany<{ year: string; count: string }>();

    return {
      totalCandidates: 1,
      totalApplications,
      byStatus,
      byDay: byDay.map((r) => ({ date: r.date, count: parseInt(r.count, 10) })),
      byMonth: byMonth.map((r) => ({ month: r.month, count: parseInt(r.count, 10) })),
      byYear: byYear.map((r) => ({ year: r.year, count: parseInt(r.count, 10) })),
    };
  }
}
