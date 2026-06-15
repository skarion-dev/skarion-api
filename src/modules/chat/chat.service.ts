import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from '../../entities/chat-room.entity';
import { ChatMessage } from '../../entities/chat-message.entity';
import { User } from '../../entities/user.entity';
import { Candidate } from '../../entities/candidate.entity';
import { SharepointService } from '../etl/sharepoint.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly roomRepo: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
    private readonly sharepointService: SharepointService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // ── Room creation ──────────────────────────────────────────────────────────

  async createRoomForCandidate(candidateId: string, candidateName: string): Promise<ChatRoom> {
    // Find all CUSTOMER_SUPPORT users
    const csUsers = await this.userRepo
      .createQueryBuilder('u')
      .innerJoin('u.roles', 'r')
      .where('r.name = :role', { role: 'customer_support' })
      .getMany();

    // Find the candidate's linked user
    const candidate = await this.candidateRepo.findOne({ where: { id: candidateId } });
    let candidateUser: User | null = null;
    if (candidate?.userId) {
      candidateUser = await this.userRepo.findOne({ where: { id: candidate.userId } });
    }

    // Determine folder number (1-indexed from existing rooms count)
    const roomCount = await this.roomRepo.count();
    const folderName = `Skarion ${roomCount + 1} (${candidateName})`;

    // Create SharePoint folder (non-blocking on failure)
    const { folderUrl } = await this.sharepointService
      .createCandidateGroupFolder(folderName)
      .catch(() => ({ folderUrl: '' }));

    // Build members list: CS users + candidate user (if linked)
    const members: User[] = [...csUsers];
    if (candidateUser && !members.some((m) => m.id === candidateUser!.id)) {
      members.push(candidateUser);
    }

    const room = this.roomRepo.create({
      candidateId,
      folderName,
      sharepointFolderUrl: folderUrl,
      members,
    });

    return this.roomRepo.save(room);
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  async getRoomsForUser(userId: string): Promise<ChatRoom[]> {
    return this.roomRepo
      .createQueryBuilder('r')
      .innerJoin('r.members', 'm', 'm.id = :userId', { userId })
      .leftJoinAndSelect('r.candidate', 'candidate')
      .leftJoinAndSelect('r.members', 'members')
      .orderBy('r.createdAt', 'DESC')
      .getMany();
  }

  async getMessages(roomId: string, userId: string): Promise<ChatMessage[]> {
    await this.assertMember(roomId, userId);
    return this.messageRepo.find({
      where: { roomId, isDeleted: false },
      relations: ['sender', 'parent', 'parent.sender'],
      order: { createdAt: 'ASC' },
    });
  }

  // ── Send message ───────────────────────────────────────────────────────────

  async sendMessage(
    roomId: string,
    senderId: string,
    text: string,
    parentId?: string,
  ): Promise<ChatMessage> {
    await this.assertMember(roomId, senderId);

    const msg = this.messageRepo.create({ roomId, senderId, text, parentId });
    const saved = await this.messageRepo.save(msg);

    const populated = await this.messageRepo.findOne({
      where: { id: saved.id },
      relations: ['sender', 'parent', 'parent.sender'],
    });

    this.chatGateway.emitMessage(roomId, populated!);
    return populated!;
  }

  // ── File upload ────────────────────────────────────────────────────────────

  async uploadFile(
    roomId: string,
    senderId: string,
    fileName: string,
    fileBuffer: Buffer,
    parentId?: string,
  ): Promise<ChatMessage> {
    await this.assertMember(roomId, senderId);

    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');

    const { url } = await this.sharepointService.uploadToCandidateFolder(
      room.folderName ?? 'General',
      fileName,
      fileBuffer,
    );

    const msg = this.messageRepo.create({ roomId, senderId, fileUrl: url, fileName, parentId });
    const saved = await this.messageRepo.save(msg);

    const populated = await this.messageRepo.findOne({
      where: { id: saved.id },
      relations: ['sender', 'parent', 'parent.sender'],
    });

    this.chatGateway.emitMessage(roomId, populated!);
    return populated!;
  }

  // ── Member management (CS only) ───────────────────────────────────────────

  async addMember(roomId: string, actorId: string, targetUserId: string): Promise<ChatRoom> {
    await this.assertCustomerSupport(actorId);
    const room = await this.getRoom(roomId);
    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('User not found');
    if (!room.members.some((m) => m.id === targetUserId)) {
      room.members.push(user);
      await this.roomRepo.save(room);
    }
    this.chatGateway.emitMemberUpdate(roomId, { type: 'added', userId: targetUserId });
    return room;
  }

  async removeMember(roomId: string, actorId: string, targetUserId: string): Promise<ChatRoom> {
    await this.assertCustomerSupport(actorId);
    const room = await this.getRoom(roomId);
    room.members = room.members.filter((m) => m.id !== targetUserId);
    await this.roomRepo.save(room);
    this.chatGateway.emitMemberUpdate(roomId, { type: 'removed', userId: targetUserId });
    return room;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async getRoom(roomId: string): Promise<ChatRoom> {
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['members', 'candidate'],
    });
    if (!room) throw new NotFoundException('Chat room not found');
    return room;
  }

  private async assertMember(roomId: string, userId: string): Promise<void> {
    const count = await this.roomRepo
      .createQueryBuilder('r')
      .innerJoin('r.members', 'm', 'm.id = :userId', { userId })
      .where('r.id = :roomId', { roomId })
      .getCount();
    if (count === 0) throw new ForbiddenException('You are not a member of this chat room');
  }

  private async assertCustomerSupport(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    const isCs = user?.roles?.some((r) => r.name === 'customer_support');
    if (!isCs) throw new ForbiddenException('Only customer support can manage members');
  }
}
