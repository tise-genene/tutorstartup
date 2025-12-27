import type { Proposal, JobPost } from '@prisma/client';
import type { ProposalStatus } from '../../prisma/prisma.enums';

export class ProposalDto {
  id!: string;
  jobPostId!: string;
  tutorId!: string;
  message!: string;
  fileUrl?: string | null;
  videoUrl?: string | null;
  status!: ProposalStatus;
  createdAt!: Date;
  updatedAt!: Date;
  jobPost?: {
    id: string;
    title: string;
    status: string;
  };

  static fromEntity(
    entity: Proposal & { jobPost?: JobPost | null },
  ): ProposalDto {
    return {
      id: entity.id,
      jobPostId: entity.jobPostId,
      tutorId: entity.tutorId,
      message: entity.message,
      fileUrl: entity.fileUrl ?? null,
      videoUrl: entity.videoUrl ?? null,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      jobPost: entity.jobPost
        ? {
            id: entity.jobPost.id,
            title: entity.jobPost.title,
            status: entity.jobPost.status,
          }
        : undefined,
    };
  }
}
