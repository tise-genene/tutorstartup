import {
  IsArray,
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const JOB_PAY_TYPES = ['HOURLY', 'MONTHLY', 'FIXED'] as const;
const GENDER_PREFERENCES = ['ANY', 'MALE', 'FEMALE'] as const;

type PayType = (typeof JOB_PAY_TYPES)[number];
type GenderPreference = (typeof GENDER_PREFERENCES)[number];

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @IsOptional()
  @IsNumber()
  locationLng?: number;

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
  payType?: PayType;

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
  genderPreference?: GenderPreference;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;
}
