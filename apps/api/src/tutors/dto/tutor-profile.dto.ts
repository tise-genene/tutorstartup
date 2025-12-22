import { TutorProfile } from '@prisma/client';

export class TutorProfileDto {
  id!: string;
  userId!: string;
  bio?: string | null;
  subjects!: string[];
  hourlyRate?: number | null;
  languages!: string[];
  location?: string | null;
  rating?: number | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(profile: TutorProfile | null): TutorProfileDto | null {
    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      userId: profile.userId,
      bio: profile.bio,
      subjects: profile.subjects ?? [],
      hourlyRate: profile.hourlyRate,
      languages: profile.languages ?? [],
      location: profile.location,
      rating: profile.rating,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
