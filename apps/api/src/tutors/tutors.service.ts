import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertTutorProfileDto } from './dto/upsert-tutor-profile.dto';
import { TutorProfileDto } from './dto/tutor-profile.dto';
import { UserRole } from '@prisma/client';
import { SearchIndexQueueService } from '../search/search-queue.service';

@Injectable()
export class TutorsService {
  private readonly logger = new Logger(TutorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchIndexQueue: SearchIndexQueueService,
  ) {}

  async upsert(
    userId: string,
    role: UserRole,
    dto: UpsertTutorProfileDto,
  ): Promise<TutorProfileDto> {
    if (role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can manage tutor profiles');
    }

    const profile = await this.prisma.tutorProfile.upsert({
      where: { userId },
      update: {
        bio: dto.bio,
        subjects: dto.subjects ?? [],
        hourlyRate: dto.hourlyRate,
        languages: dto.languages ?? [],
        location: dto.location,
      },
      create: {
        userId,
        bio: dto.bio,
        subjects: dto.subjects ?? [],
        hourlyRate: dto.hourlyRate,
        languages: dto.languages ?? [],
        location: dto.location,
      },
    });

    void this.searchIndexQueue.enqueueUpsert(userId);

    return TutorProfileDto.fromEntity(profile)!;
  }

  async getMine(userId: string): Promise<TutorProfileDto> {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }

    return TutorProfileDto.fromEntity(profile)!;
  }

  async getByUserId(userId: string): Promise<TutorProfileDto> {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }
    return TutorProfileDto.fromEntity(profile)!;
  }
}
