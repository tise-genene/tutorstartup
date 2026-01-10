import {
  IsArray,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const JOB_PAY_TYPES = ['HOURLY', 'MONTHLY', 'FIXED'] as const;
const GENDER_PREFERENCES = ['ANY', 'MALE', 'FEMALE'] as const;

export class CreateJobDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(8000)
  description!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  grade?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sessionMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  daysPerWeek?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  startTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  endTime?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredDays?: string[];

  @IsOptional()
  @IsString()
  @IsIn(JOB_PAY_TYPES as unknown as string[])
  payType?: (typeof JOB_PAY_TYPES)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  hourlyAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  fixedAmount?: number;

  @IsOptional()
  @IsString()
  @IsIn(GENDER_PREFERENCES as unknown as string[])
  genderPreference?: (typeof GENDER_PREFERENCES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;
}
