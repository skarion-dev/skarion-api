import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from 'src/entities/course.entity';
import { Purchase } from 'src/entities/purchase.entity';
import { CreateCourseDto } from './dtos';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
    @InjectRepository(Purchase)
    private purchaseRepo: Repository<Purchase>,
  ) {}

  async findAll() {
    return this.courseRepo.find();
  }

  async findOne(id: string) {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async findOneBySlug(slug: string) {
    const course = await this.courseRepo.findOne({ where: { slug } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async create(data: CreateCourseDto) {
    const course = this.courseRepo.create({
      ...data,
      slug: this.createSlug(data.title),
    });
    return this.courseRepo.save(course);
  }

  async getMyCourses(userId: string) {
    const purchases = await this.purchaseRepo.find({
      where: { userId },
      relations: ['course'],
    });

    const courses = purchases.map((p) => p.course);

    return courses;
  }

  async getUserCourse(userId: string, courseId: string) {
    try {
      const purchase = await this.purchaseRepo.findOne({
        where: { userId, courseId, status: 'paid' },
        relations: ['course'],
      });
      return purchase ? purchase.course : null;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s\-_]/g, '')
      .trim()
      .replace(/[\s\-_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
