import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../prisma/prisma.enums';
import { SearchService } from './search.service';
import { SearchTutorDocument } from './interfaces/search-tutor-document.interface';

@Injectable()
export class SearchIndexerService {
  private readonly logger = new Logger(SearchIndexerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  async syncTutorProfile(userId: string): Promise<void> {
    if (!this.searchService.isEnabled()) {
      return;
    }

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
      await this.removeTutorProfile(userId);
      return;
    }

    const document: SearchTutorDocument = {
      id: tutor.id,
      profileId: tutor.tutorProfile.id,
      name: tutor.name,
      bio: tutor.tutorProfile.bio,
      subjects: tutor.tutorProfile.subjects ?? [],
      hourlyRate: tutor.tutorProfile.hourlyRate,
      languages: tutor.tutorProfile.languages ?? [],
      location: tutor.tutorProfile.location,
      rating: tutor.tutorProfile.rating,
      updatedAt: tutor.tutorProfile.updatedAt.toISOString(),
    };

    await this.searchService.upsertTutor(document);
  }

  async removeTutorProfile(userId: string): Promise<void> {
    if (!this.searchService.isEnabled()) {
      return;
    }

    try {
      await this.searchService.removeTutor(userId);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to remove tutor ${userId} from search index`,
        err.stack,
      );
    }
  }
}
