import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../../entities/job.entity';
import { CrawlerStatus } from '../../entities/crawler-status.entity';
import { CreateJobDto, CrawlerHeartbeatDto } from './dtos';
import { JobsGateway } from './jobs.gateway';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(CrawlerStatus)
    private readonly crawlerStatusRepository: Repository<CrawlerStatus>,
    private readonly jobsGateway: JobsGateway,
  ) {}

  async createOrUpdate(createJobDto: CreateJobDto) {
    const existingJob = await this.jobRepository.findOne({
      where: { externalId: createJobDto.externalId, company: createJobDto.company },
    });

    if (existingJob) {
      existingJob.title = createJobDto.title;
      existingJob.link = createJobDto.link;
      existingJob.postedAt = createJobDto.postedAt
        ? new Date(createJobDto.postedAt)
        : existingJob.postedAt ?? new Date();
      existingJob.platform = createJobDto.platform ?? existingJob.platform;
      existingJob.location = createJobDto.location ?? existingJob.location;
      existingJob.employmentType =
        createJobDto.employmentType ?? existingJob.employmentType;
      existingJob.workplaceType =
        createJobDto.workplaceType ?? existingJob.workplaceType;
      existingJob.sourceUrl = createJobDto.sourceUrl ?? existingJob.sourceUrl;
      existingJob.metadata = createJobDto.metadata ?? existingJob.metadata;
      const saved = await this.jobRepository.save(existingJob);
      this.jobsGateway.emitJobUpsert(saved);
      return saved;
    }

    const job = this.jobRepository.create({
      ...createJobDto,
      postedAt: createJobDto.postedAt ? new Date(createJobDto.postedAt) : new Date(),
    });

    const saved = await this.jobRepository.save(job);
    this.jobsGateway.emitJobUpsert(saved);
    return saved;
  }

  async findAllGroupedByCompany() {
    const jobs = await this.jobRepository.find({
      where: { isDeleted: false },
      order: { postedAt: 'DESC' },
    });

    const grouped = jobs.reduce((acc, job) => {
      if (!acc[job.company]) {
        acc[job.company] = [];
      }
      acc[job.company].push(job);
      return acc;
    }, {} as Record<string, Job[]>);

    return grouped;
  }

  async upsertCrawlerHeartbeat(heartbeat: CrawlerHeartbeatDto) {
    const crawlerName = heartbeat.crawlerName || 'job-radar';
    let status = await this.crawlerStatusRepository.findOne({
      where: { crawlerName },
    });

    if (!status) {
      status = this.crawlerStatusRepository.create({
        crawlerName,
      });
    }

    status.isActive = heartbeat.isActive;
    status.message = heartbeat.message ?? status.message;
    status.lastHeartbeatAt = new Date();
    await this.crawlerStatusRepository.save(status);

    const response = await this.getCrawlerStatus(crawlerName);
    this.jobsGateway.emitCrawlerStatus({
      crawlerName: response.crawlerName,
      isActive: response.isActive,
      lastHeartbeatAt: response.lastHeartbeatAt,
      isOnline: response.isOnline,
      offlineThresholdMinutes: response.offlineThresholdMinutes,
      message: response.message,
    });
    return response;
  }

  async getCrawlerStatus(crawlerName = 'job-radar') {
    const offlineThresholdMinutes = 60;
    const status = await this.crawlerStatusRepository.findOne({
      where: { crawlerName },
    });

    if (!status?.lastHeartbeatAt) {
      return {
        crawlerName,
        isActive: false,
        lastHeartbeatAt: null,
        isOnline: false,
        offlineThresholdMinutes,
        message: 'No heartbeat received yet',
      };
    }

    const ageMs = Date.now() - status.lastHeartbeatAt.getTime();
    const isOnline = status.isActive && ageMs <= offlineThresholdMinutes * 60_000;

    return {
      crawlerName: status.crawlerName,
      isActive: status.isActive,
      lastHeartbeatAt: status.lastHeartbeatAt,
      isOnline,
      offlineThresholdMinutes,
      message: status.message ?? null,
    };
  }
}
