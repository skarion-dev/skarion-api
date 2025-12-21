export class CreateChatDto {
  chatName: string;
  userIds: string[];
  guests?: { email: string; name: string }[];
  courseName?: string;
}
