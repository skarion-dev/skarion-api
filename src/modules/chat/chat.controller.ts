import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@ApiTags('Chat')
@Controller('chat')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({ summary: 'List chat rooms the current user belongs to' })
  async getRooms(@Req() req: any) {
    return this.chatService.getRoomsForUser(req.user.sub);
  }

  @Get('rooms/:id/messages')
  @ApiOperation({ summary: 'Get all messages in a room' })
  async getMessages(@Param('id') roomId: string, @Req() req: any) {
    return this.chatService.getMessages(roomId, req.user.sub);
  }

  @Post('rooms/:id/messages')
  @ApiOperation({ summary: 'Send a text message' })
  async sendMessage(
    @Param('id') roomId: string,
    @Body() body: { text: string; parentId?: string },
    @Req() req: any,
  ) {
    return this.chatService.sendMessage(roomId, req.user.sub, body.text, body.parentId);
  }

  @Post('rooms/:id/upload')
  @ApiOperation({ summary: 'Upload a file to the chat (stored in SharePoint)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id') roomId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { parentId?: string },
    @Req() req: any,
  ) {
    return this.chatService.uploadFile(
      roomId,
      req.user.sub,
      file.originalname,
      file.buffer,
      body.parentId,
    );
  }

  @Post('rooms/:id/members')
  @ApiOperation({ summary: 'Add a user to the chat room (CS only)' })
  async addMember(
    @Param('id') roomId: string,
    @Body() body: { userId: string },
    @Req() req: any,
  ) {
    return this.chatService.addMember(roomId, req.user.sub, body.userId);
  }

  @Delete('rooms/:id/members/:userId')
  @ApiOperation({ summary: 'Remove a user from the chat room (CS only)' })
  async removeMember(
    @Param('id') roomId: string,
    @Param('userId') targetUserId: string,
    @Req() req: any,
  ) {
    return this.chatService.removeMember(roomId, req.user.sub, targetUserId);
  }
}
