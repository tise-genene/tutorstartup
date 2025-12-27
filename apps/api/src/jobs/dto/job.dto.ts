import type { JobPost } from '@prisma/client';
import type { JobPostStatus } from '../../prisma/prisma.enums';

export class JobDto {
  id!: string;
  parentId!: string;
  title!: string;
  description!: string;
  subjects!: string[];
  location?: string | null;
  budget?: number | null;
  status!: JobPostStatus;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(entity: JobPost): JobDto {
    return {
      id: entity.id,
      parentId: entity.parentId,
      title: entity.title,
      description: entity.description,
      subjects: entity.subjects,
      location: entity.location,
      budget: entity.budget,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
