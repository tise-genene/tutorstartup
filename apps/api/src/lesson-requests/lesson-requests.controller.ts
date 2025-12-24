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
import { LessonRequestStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { LessonRequestsService } from './lesson-requests.service';
import { CreateLessonRequestDto } from './dto/create-lesson-request.dto';
import { LessonRequestDto } from './dto/lesson-request.dto';
import { UpdateLessonRequestDto } from './dto/update-lesson-request.dto';

@Controller({ path: 'lesson-requests', version: '1' })
export class LessonRequestsController {
  constructor(private readonly service: LessonRequestsService) {}

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get('inbox')
  async inbox(@CurrentUser() user: JwtPayload) {
    const requests = await this.service.listInbox({
      id: user.sub,
      role: user.role,
    });
    return requests.map(LessonRequestDto.fromEntity);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLessonRequestDto,
  ) {
    const updated = await this.service.updateStatus(
      { id: user.sub, role: user.role },
      id,
      dto.status as LessonRequestStatus,
    );
    return LessonRequestDto.fromEntity(updated);
  }
}
