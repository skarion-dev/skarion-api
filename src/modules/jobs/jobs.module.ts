import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../../entities/job.entity';
import { CrawlerStatus } from '../../entities/crawler-status.entity';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsGateway } from './jobs.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Job, CrawlerStatus])],
  providers: [JobsService, JobsGateway],
  controllers: [JobsController],
  exports: [JobsService],
})
export class JobsModule {}
