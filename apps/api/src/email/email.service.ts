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

    const resolvedFrom = from.length > 0 ? from : 'onboarding@resend.dev';

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
