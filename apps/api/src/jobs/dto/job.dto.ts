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

  grade?: number | null;
  sessionMinutes?: number | null;
  daysPerWeek?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  preferredDays!: string[];
  payType?: string | null;
  hourlyAmount?: number | null;
  monthlyAmount?: number | null;
  fixedAmount?: number | null;
  genderPreference?: string | null;
  currency?: string | null;

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
      grade: entity.grade,
      sessionMinutes: entity.sessionMinutes,
      daysPerWeek: entity.daysPerWeek,
      startTime: entity.startTime,
      endTime: entity.endTime,
      preferredDays: entity.preferredDays,
      payType: entity.payType as unknown as string | null,
      hourlyAmount: entity.hourlyAmount,
      monthlyAmount: entity.monthlyAmount,
      fixedAmount: entity.fixedAmount,
      genderPreference: entity.genderPreference as unknown as string | null,
      currency: entity.currency,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
