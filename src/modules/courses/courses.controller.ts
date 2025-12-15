import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto, CourseResponse } from './dtos';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { RequireAuth } from 'src/common/decorator/require-auth.decorator';
import { type IAuthenticatedUser } from 'src/common/interfaces/current-user-payload.interface';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({
    status: 200,
    description: 'List of all courses',
    type: [CourseResponse],
  })
  findAll() {
    return this.coursesService.findAll();
  }

  @Get('my-courses')
  @RequireAuth()
  @ApiOperation({ summary: 'Get my courses' })
  @ApiResponse({
    status: 200,
    description: 'List of my courses',
    type: [CourseResponse],
  })
  getMyCourses(@CurrentUser() user: IAuthenticatedUser) {
    return this.coursesService.getMyCourses(user.id);
  }

  @Get('my-courses/:courseId')
  @RequireAuth()
  @ApiOperation({ summary: 'Get a specific course if owned by the user' })
  @ApiResponse({
    status: 200,
    description: 'Course details if user owns it',
    type: CourseResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found or not owned by user',
  })
  async getMyCourse(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('courseId') courseId: string,
  ) {
    const course = await this.coursesService.getUserCourse(user.id, courseId);

    if (!course) {
      throw new NotFoundException('Course not found or not owned by user');
    }

    return course;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID' })
  @ApiResponse({
    status: 200,
    description: 'The found course',
    type: CourseResponse,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a course by slug' })
  @ApiResponse({
    status: 200,
    description: 'The found course',
    type: CourseResponse,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  findOneBySlug(@Param('slug') slug: string) {
    return this.coursesService.findOneBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({
    status: 201,
    description: 'The created course',
    type: CourseResponse,
  })
  create(@Body() data: CreateCourseDto) {
    return this.coursesService.create(data);
  }
}
