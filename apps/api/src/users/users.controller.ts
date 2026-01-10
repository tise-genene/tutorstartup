import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { AuthenticatedUserDto } from '../auth/dto/auth-response.dto';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: JwtPayload): Promise<AuthenticatedUserDto> {
    const found = await this.users.findByIdOrFail(user.sub);
    return {
      id: found.id,
      email: found.email,
      name: found.name,
      role: found.role,
      isVerified: found.isVerified,
      avatarUrl: found.avatarUrl ?? null,
    };
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMeDto,
  ): Promise<AuthenticatedUserDto> {
    const updated = await this.users.updateMe(user.sub, {
      avatarUrl: dto.avatarUrl,
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      isVerified: updated.isVerified,
      avatarUrl: updated.avatarUrl ?? null,
    };
  }
}
