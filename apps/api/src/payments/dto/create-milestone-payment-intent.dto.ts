import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateMilestonePaymentIntentDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
}
