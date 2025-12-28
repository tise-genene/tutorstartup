import type { ContractMilestone } from '@prisma/client';
import type { ContractMilestoneStatus } from '../../prisma/prisma.enums';

export class ContractMilestoneDto {
  id!: string;
  contractId!: string;
  title!: string;
  amount!: number;
  currency!: string;
  status!: ContractMilestoneStatus;
  fundedAt!: Date | null;
  releasedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(entity: ContractMilestone): ContractMilestoneDto {
    return {
      id: entity.id,
      contractId: entity.contractId,
      title: entity.title,
      amount: entity.amount,
      currency: entity.currency,
      status: entity.status,
      fundedAt: entity.fundedAt ?? null,
      releasedAt: entity.releasedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
