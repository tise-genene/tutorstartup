import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class SendContractMessageDto {
  @IsString()
  @MaxLength(4000)
  body!: string;

  @IsOptional()
  @IsUrl(
    {
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ['https'],
    },
    { message: 'attachmentUrl must be a valid https URL' },
  )
  attachmentUrl?: string;
}
