import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    const apiKey = (
      this.configService.get<string>('RESEND_API_KEY') ?? ''
    ).trim();
    const from = (
      this.configService.get<string>('RESEND_FROM_EMAIL') ?? ''
    ).trim();

    if (!apiKey) {
      this.logger.warn(
        `RESEND_API_KEY not configured; skipping email to ${params.to} (${params.subject})`,
      );
      return;
    }

    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: from.length > 0 ? from : 'no-reply@tutorstartup.local',
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
  }
}
