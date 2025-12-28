import type { Contract, JobPost } from '@prisma/client';
import type { ContractStatus } from '../../prisma/prisma.enums';

type PersonSummary = { id: string; name: string; role: string };

export class ContractDto {
  id!: string;
  jobPostId!: string;
  proposalId!: string;
  parentId!: string;
  tutorId!: string;
  status!: ContractStatus;
  amount!: number | null;
  currency!: string;
  createdAt!: Date;
  updatedAt!: Date;

  jobPost?: { id: string; title: string; status: string };
  parent?: PersonSummary;
  tutor?: PersonSummary;

  static fromEntity(
    entity: Contract & {
      jobPost?: JobPost | null;
      parent?: PersonSummary | null;
      tutor?: PersonSummary | null;
    },
  ): ContractDto {
    return {
      id: entity.id,
      jobPostId: entity.jobPostId,
      proposalId: entity.proposalId,
      parentId: entity.parentId,
      tutorId: entity.tutorId,
      status: entity.status,
      amount: (entity as any).amount ?? null,
      currency: (entity as any).currency ?? 'ETB',
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      jobPost: entity.jobPost
        ? {
            id: entity.jobPost.id,
            title: entity.jobPost.title,
            status: entity.jobPost.status,
          }
        : undefined,
      parent: entity.parent
        ? {
            id: entity.parent.id,
            name: entity.parent.name,
            role: entity.parent.role,
          }
        : undefined,
      tutor: entity.tutor
        ? {
            id: entity.tutor.id,
            name: entity.tutor.name,
            role: entity.tutor.role,
          }
        : undefined,
    };
  }
}
