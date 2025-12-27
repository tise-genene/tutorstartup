import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @MaxLength(8000)
  message!: string;

  @IsOptional()
  @IsUrl(
    {
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ['https'],
    },
    { message: 'fileUrl must be a valid https URL' },
  )
  fileUrl?: string;

  @IsOptional()
  @IsUrl(
    {
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ['https'],
    },
    { message: 'videoUrl must be a valid https URL' },
  )
  videoUrl?: string;
}
