import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Candidate } from '../../entities/candidate.entity';
import { JobApplication } from '../../entities/job-application.entity';
import { EtlController } from './etl.controller';
import { CandidateService } from './candidate.service';
import { JobApplicationService } from './job-application.service';
import { SharepointService } from './sharepoint.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate, JobApplication]),
    MulterModule.register({ storage: undefined }), // memory storage (buffer)
  ],
  controllers: [EtlController],
  providers: [CandidateService, JobApplicationService, SharepointService],
  exports: [CandidateService, JobApplicationService, SharepointService],
})
export class EtlModule {}
