import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { ChatRoom } from '../../entities/chat-room.entity';
import { ChatMessage } from '../../entities/chat-message.entity';
import { User } from '../../entities/user.entity';
import { Candidate } from '../../entities/candidate.entity';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { EtlModule } from '../etl/etl.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, ChatMessage, User, Candidate]),
    MulterModule.register({ storage: multer.memoryStorage() }), // keep file in RAM so file.buffer is populated
    EtlModule, // provides SharepointService
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
