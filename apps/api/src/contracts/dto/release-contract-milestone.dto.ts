import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReleaseContractMilestoneDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
