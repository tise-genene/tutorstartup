import { Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const toNumber = (value: unknown, fallback: number): number => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => `${item}`.split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return `${value}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export class SearchTutorsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Transform(({ value }) => toNumber(value, 20))
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;

  @IsOptional()
  @Transform(({ value }) => toNumber(value, 1))
  @IsInt()
  @Min(1)
  page = 1;
}
