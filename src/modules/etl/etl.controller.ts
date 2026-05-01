import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { CandidateService } from './candidate.service';
import { JobApplicationService } from './job-application.service';
import { SharepointService } from './sharepoint.service';
import { CreateCandidateDto, CreateJobApplicationDto, UpdateJobApplicationDto } from './dtos';
import { AuthGuard } from '../../common/guards/auth.guard';

@ApiTags('ETL Dashboard')
@Controller('etl')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class EtlController {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly jobAppService: JobApplicationService,
    private readonly sharepointService: SharepointService,
  ) {}


  @Get('candidates')
  @ApiOperation({ summary: 'Get all candidates' })
  async findAllCandidates() {
    return this.candidateService.findAll();
  }

  @Post('candidates')
  @ApiOperation({ summary: 'Create a new candidate' })
  async createCandidate(@Body() dto: CreateCandidateDto) {
    return this.candidateService.create(dto);
  }

  @Get('job-applications')
  @ApiOperation({ summary: 'Get all job applications' })
  async findAllJobApps() {
    return this.jobAppService.findAll();
  }

  @Post('job-applications')
  @ApiOperation({ summary: 'Create a job application log' })
  async createJobApp(@Req() req: any, @Body() dto: CreateJobApplicationDto) {
    return this.jobAppService.create(req.user.sub, dto);
  }

  @Patch('job-applications/:id')
  @ApiOperation({ summary: 'Update a job application' })
  async updateJobApp(
    @Param('id') id: string,
    @Body() dto: UpdateJobApplicationDto,
  ) {
    return this.jobAppService.update(id, dto);
  }

  @Delete('job-applications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a job application' })
  async deleteJobApp(@Param('id') id: string) {
    await this.jobAppService.remove(id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getStats() {
    return this.jobAppService.getStats();
  }

  @Post('resume/upload')
  @ApiOperation({ summary: 'Upload a resume file to SharePoint' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @Query('candidateName') candidateName?: string,
  ) {
    return this.sharepointService.uploadResume(
      file.originalname,
      file.buffer,
      candidateName,
    );
  }

  /**
   * Proxy download: fetches the resume bytes from SharePoint via Graph API
   * and streams them to the browser — no MS authentication required client-side.
   * Usage: GET /etl/resume/download?url=<encoded SharePoint webUrl>
   */
  @Get('resume/download')
  @ApiOperation({ summary: 'Download a resume file proxied from SharePoint' })
  async downloadResume(
    @Query('url') webUrl: string,
    @Req() req: any,
  ) {
    const { buffer, contentType, fileName } =
      await this.sharepointService.downloadResumeByWebUrl(
        decodeURIComponent(webUrl),
      );

    const res = req.res as import('express').Response;
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-store',
    });
    res.end(buffer);
  }
}
