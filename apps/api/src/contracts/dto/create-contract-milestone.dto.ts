import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateContractMilestoneDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
}
