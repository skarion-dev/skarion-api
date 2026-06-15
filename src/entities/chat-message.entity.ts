import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ChatRoom } from './chat-room.entity';
import { User } from './user.entity';

@Entity('chat_messages')
export class ChatMessage extends BaseEntity {
  @Column('uuid')
  roomId: string;

  @ManyToOne(() => ChatRoom, (room) => room.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: ChatRoom;

  @Column('uuid')
  senderId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'text', nullable: true })
  text?: string;

  /** SharePoint URL of the attached file */
  @Column({ nullable: true })
  fileUrl?: string;

  @Column({ nullable: true })
  fileName?: string;

  /** Self-referencing FK for threaded replies */
  @Column('uuid', { nullable: true })
  parentId?: string;

  @ManyToOne(() => ChatMessage, (msg) => msg.replies, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent?: ChatMessage;

  @OneToMany(() => ChatMessage, (msg) => msg.parent)
  replies: ChatMessage[];
}
