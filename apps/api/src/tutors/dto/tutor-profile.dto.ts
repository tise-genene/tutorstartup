import type { TutorProfile } from '@prisma/client';

export class TutorProfileDto {
  id!: string;
  userId!: string;
  name?: string;
  bio?: string | null;
  subjects!: string[];
  hourlyRate?: number | null;
  languages!: string[];
  location?: string | null;
  rating?: number | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(
    profile: TutorProfile | null,
    name?: string,
  ): TutorProfileDto | null {
    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      userId: profile.userId,
      name,
      bio: profile.bio,
      subjects: profile.subjects ?? [],
      hourlyRate: profile.hourlyRate ? Number(profile.hourlyRate) : null,
      languages: profile.languages ?? [],
      location: profile.location,
      rating: profile.rating,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
