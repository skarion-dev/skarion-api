import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from 'src/entities/course.entity';
import { User } from 'src/entities/user.entity';
import { Purchase } from 'src/entities/purchase.entity';

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

  async create(data: Partial<Course>) {
    return this.courseRepo.save(this.courseRepo.create(data));
  }

  async getMyCourses(userId: string) {
    const purchases = await this.purchaseRepo.find({
      where: { userId },
      relations: ['course'],
    });

    const courses = purchases.map((p) => p.course);

    return courses;
  }
}
