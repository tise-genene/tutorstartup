import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../prisma/prisma.enums';
import { LessonRequestsService } from './lesson-requests.service';
import { CreateLessonRequestDto } from './dto/create-lesson-request.dto';
import { LessonRequestDto } from './dto/lesson-request.dto';
import { UpdateLessonRequestDto } from './dto/update-lesson-request.dto';

@Controller({ path: 'lesson-requests', version: '1' })
export class LessonRequestsController {
  constructor(private readonly service: LessonRequestsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateLessonRequestDto,
  ) {
    const created = await this.service.create(
      { id: user.sub, role: user.role },
      dto,
    );
    return LessonRequestDto.fromEntity(created);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @Get('inbox')
  async inbox(@CurrentUser() user: JwtPayload) {
    const requests = await this.service.listInbox({
      id: user.sub,
      role: user.role,
    });
    return requests.map((request) => LessonRequestDto.fromEntity(request));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @Get('inbox/count')
  async inboxCount(@CurrentUser() user: JwtPayload) {
    const pending = await this.service.countPendingInbox({
      id: user.sub,
      role: user.role,
    });
    return { pending };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @Patch(':id')
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLessonRequestDto,
  ) {
    const updated = await this.service.updateStatus(
      { id: user.sub, role: user.role },
      id,
      dto,
    );
    return LessonRequestDto.fromEntity(updated);
  }
}
