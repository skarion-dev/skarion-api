import { Body, Controller, Post } from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateChatDto } from './dtos';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post('create-chat')
  async createChat(@Body() createChatDto: CreateChatDto) {
    return await this.teamService.createGroupChat(createChatDto);
  }
}
