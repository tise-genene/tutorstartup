import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PayoutContractMilestoneDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
