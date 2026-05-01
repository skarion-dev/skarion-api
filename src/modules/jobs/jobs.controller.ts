import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto, CrawlerHeartbeatDto } from './dtos';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Receive a new job from the crawler' })
  @ApiResponse({ status: 201, description: 'Job received successfully' })
  async create(@Body() createJobDto: CreateJobDto) {
    return this.jobsService.createOrUpdate(createJobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs grouped by company' })
  async findAll() {
    return this.jobsService.findAllGroupedByCompany();
  }

  @Post('crawler-status')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Receive crawler heartbeat status' })
  async updateCrawlerStatus(@Body() heartbeatDto: CrawlerHeartbeatDto) {
    return this.jobsService.upsertCrawlerHeartbeat(heartbeatDto);
  }

  @Get('crawler-status')
  @ApiOperation({ summary: 'Get crawler status heartbeat' })
  async getCrawlerStatus() {
    return this.jobsService.getCrawlerStatus();
  }

  @Get('test')
  test() {
    return { message: 'Jobs controller is working' };
  }
}
