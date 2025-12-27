import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @MaxLength(8000)
  message!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'fileUrl must be a valid URL' })
  fileUrl?: string;

  @IsOptional()
  @IsUrl(
    { require_protocol: true },
    { message: 'videoUrl must be a valid URL' },
  )
  videoUrl?: string;
}
