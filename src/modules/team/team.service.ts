import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { MailerService } from '../mailer/mailer.service';
import { MicrosoftService } from '../microsoft/microsoft.service';
import { buildTeamChatInviteEmail, buildTeamChatInviteText } from '../mailer/email-templates.service';
import { CreateChatDto } from './dtos';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class TeamService {
  private graphApiUrl = 'https://graph.microsoft.com/v1.0';

  constructor(
    private readonly mailerService: MailerService,
    private readonly microsoftService: MicrosoftService,
  ) {}

  async createGroupChat(createChatDto: CreateChatDto) {
    const accessToken = await this.microsoftService.getAccessToken();

    const createChatResponse = await axios.post(
      `${this.graphApiUrl}/chats`,
      {
        topic: createChatDto.chatName,
        chatType: 'group',
        members: createChatDto.userIds.map((userId) => ({
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${userId}')`,
        })),
      },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const chatId = createChatResponse.data.id;
    const chatWebUrl = createChatResponse.data.webUrl;

    if (createChatDto.guests?.length) {
      for (const guest of createChatDto.guests) {
        try {
          const userId = await this.getOrCreateGuestUser(
            guest.email,
            accessToken,
          );

          await this.addMemberWithRetry(chatId, userId, accessToken);

          await this.sendEmailInvite(
            guest.email,
            chatWebUrl,
            guest.name,
            createChatDto.courseName,
          );
        } catch (err) {
          console.error(`Final failure for guest ${guest.email}:`, err.message);
        }
      }
    }

    return { chatId, inviteLink: chatWebUrl };
  }

  private async getOrCreateGuestUser(
    email: string,
    accessToken: string,
  ): Promise<string> {
    const searchRes = await axios.get(
      `${this.graphApiUrl}/users?$filter=mail eq '${email}' or userPrincipalName eq '${email}'`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (searchRes.data.value.length > 0) {
      return searchRes.data.value[0].id;
    }

    const inviteRes = await axios.post(
      `${this.graphApiUrl}/invitations`,
      {
        invitedUserEmailAddress: email,
        inviteRedirectUrl: 'https://teams.microsoft.com',
        sendInvitationMessage: false,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    return inviteRes.data.invitedUser.id;
  }

  private async addMemberWithRetry(
    chatId: string,
    userId: string,
    accessToken: string,
    attempt = 1,
  ) {
    try {
      await axios.post(
        `${this.graphApiUrl}/chats/${chatId}/members`,
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['guest'],
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${userId}')`,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      console.log(`Successfully added user ${userId} on attempt ${attempt}`);
    } catch (error) {
      const isRetryable =
        error.response?.status === 403 || error.response?.status === 404;

      if (isRetryable && attempt < 10) {
        const delay = attempt * 3000;
        console.warn(
          `Member sync pending (Attempt ${attempt}). Retrying in ${delay}ms...`,
        );
        await sleep(delay);
        return this.addMemberWithRetry(
          chatId,
          userId,
          accessToken,
          attempt + 1,
        );
      }
      throw error;
    }
  }

  private async sendEmailInvite(
    email: string,
    inviteLink: string,
    name: string,
    courseName?: string,
  ) {
    const course = courseName || 'Outside Plant Engineering course';

    const html = buildTeamChatInviteEmail({
      name,
      courseName: course,
      inviteLink,
    });

    const text = buildTeamChatInviteText({
      name,
      courseName: course,
      inviteLink,
    });

    await this.mailerService.sendMail({
      recipients: [email],
      subject: `Welcome to the ${course} Program at Skarion`,
      text,
      html,
      placeholders: {},
    });
  }
}
