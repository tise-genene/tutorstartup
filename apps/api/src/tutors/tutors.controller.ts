import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TutorsService } from './tutors.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpsertTutorProfileDto } from './dto/upsert-tutor-profile.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../prisma/prisma.enums';

@Controller({ path: 'tutors', version: '1' })
export class TutorsController {
  constructor(private readonly tutorsService: TutorsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @Put('me')
  upsertMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertTutorProfileDto,
  ) {
    return this.tutorsService.upsert(user.sub, user.role, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @Get('me')
  getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.tutorsService.getMine(user.sub);
  }

  @Get(':userId')
  getByUserId(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.tutorsService.getByUserId(userId);
  }
}
