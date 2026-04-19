import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormResponse } from '../../entities/form-response.entity';

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);

  constructor(
    @InjectRepository(FormResponse)
    private readonly formResponseRepository: Repository<FormResponse>,
  ) {}

  async processWebhook(payload: any) {
    this.logger.log('Received MS Forms Webhook payload', JSON.stringify(payload));

    // Power Automate HTTP action will send the JSON we define.
    // Assuming we map it like: { referralCode: "XYZ", name: "John", email: "john@x.com", scheduleDate: "..." }
    // But we fall back to rawPayload for safety.

    const formResponse = this.formResponseRepository.create({
      name: payload.name || null,
      email: payload.email || null,
      address: payload.address || null,
      phoneNumber: payload.phoneNumber || null,
      specialRequests: payload.specialRequests || null,
      referralCode: payload.referralCode || null,
      rawPayload: payload,
    });

    await this.formResponseRepository.save(formResponse);

    return { success: true };
  }

  async getFormResponses(referralCode?: string) {
    const query = this.formResponseRepository.createQueryBuilder('fr')
      .orderBy('fr.createdAt', 'DESC');

    if (referralCode) {
      query.where('fr.referralCode = :referralCode', { referralCode });
    }

    return query.getMany();
  }
}
