import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Candidate } from './candidate.entity';
import { User } from './user.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_rooms')
export class ChatRoom extends BaseEntity {
  @Column('uuid')
  candidateId: string;

  @ManyToOne(() => Candidate, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  /** E.g. "Skarion 3 (Jane Doe)" */
  @Column({ nullable: true })
  folderName?: string;

  /** SharePoint webUrl of the created candidate folder */
  @Column({ nullable: true })
  sharepointFolderUrl?: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'chat_room_members',
    joinColumn: { name: 'roomId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  members: User[];

  @OneToMany(() => ChatMessage, (msg) => msg.room, { cascade: true })
  messages: ChatMessage[];
}
