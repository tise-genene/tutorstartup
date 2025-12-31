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

    const placeholderFrom = 'no-reply@tutorstartup.local';
    const resolvedFrom =
      from.length === 0 || from.toLowerCase() === placeholderFrom
        ? 'onboarding@resend.dev'
        : from;

    if (from.toLowerCase() === placeholderFrom) {
      this.logger.warn(
        `RESEND_FROM_EMAIL is set to placeholder (${placeholderFrom}); using onboarding@resend.dev instead. Set RESEND_FROM_EMAIL to a verified sender for production.`,
      );
    }

    try {
      const result = await resend.emails.send({
        from: resolvedFrom,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      const id = (result as { id?: string } | undefined)?.id;
      this.logger.log(
        `Sent email to ${params.to} (${params.subject})${id ? ` id=${id}` : ''}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(
        `Failed to send email to ${params.to} (${params.subject}) from=${resolvedFrom}: ${message}`,
      );
    }
  }
}
