import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpsertTutorProfileDto } from './dto/upsert-tutor-profile.dto.js';
import { TutorProfileDto } from './dto/tutor-profile.dto.js';
import { UserRole } from '../prisma/prisma.enums';
import { SearchIndexQueueService } from '../search/search-queue.service.js';

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
    const tutor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        tutorProfile: true,
      },
    });

    if (!tutor || tutor.role !== UserRole.TUTOR || !tutor.tutorProfile) {
      throw new NotFoundException('Tutor profile not found');
    }

    return TutorProfileDto.fromEntity(tutor.tutorProfile, tutor.name)!;
  }
}
