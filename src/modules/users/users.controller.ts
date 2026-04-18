import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserAffiliateDto } from './dtos';
import { RequirePermissions } from '../../common/decorator/require-permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuthGuard } from '../../common/guards/auth.guard'; // Assuming AuthGuard populates req.user

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('MANAGE_USERS')
  @ApiOperation({ summary: 'Get all users' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/affiliate')
  @RequirePermissions('MANAGE_USERS')
  @ApiOperation({ summary: 'Make a user an affiliate and assign referral code' })
  async makeAffiliate(
    @Param('id') id: string,
    @Body() updateUserAffiliateDto: UpdateUserAffiliateDto,
  ) {
    return this.usersService.makeAffiliate(id, updateUserAffiliateDto.referralCode);
  }
}
