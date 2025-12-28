import type { ContractMessage } from '@prisma/client';

type SenderSummary = { id: string; name: string; role: string };

export class ContractMessageDto {
  id!: string;
  contractId!: string;
  senderId!: string;
  body!: string;
  attachmentUrl?: string | null;
  createdAt!: Date;
  sender?: SenderSummary;

  static fromEntity(
    entity: ContractMessage & { sender?: SenderSummary | null },
  ) {
    return {
      id: entity.id,
      contractId: entity.contractId,
      senderId: entity.senderId,
      body: entity.body,
      attachmentUrl: entity.attachmentUrl ?? null,
      createdAt: entity.createdAt,
      sender: entity.sender
        ? {
            id: entity.sender.id,
            name: entity.sender.name,
            role: entity.sender.role,
          }
        : undefined,
    } satisfies ContractMessageDto;
  }
}
