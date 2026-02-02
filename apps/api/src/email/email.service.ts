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

    const smtp = this.getSmtpConfig();

    // 1) Prefer Resend when configured.
    if (apiKey) {
      const resendOutcome = await this.trySendViaResend({
        apiKey,
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      if (resendOutcome.ok) {
        return;
      }

      // If Resend fails for any reason and SMTP is configured, fall back so auth flows
      // still deliver emails in environments where Resend cannot (e.g. testing mode).
      if (smtp.configured) {
        this.logger.warn(
          `Resend failed; falling back to SMTP for ${params.to} (${params.subject})`,
        );
        await this.sendViaSmtp(smtp, params);
      }

      // If Resend failed and SMTP isn't configured, we're done.
      return;
    }

    // 2) Fall back to SMTP if configured.
    if (smtp.configured) {
      await this.sendViaSmtp(smtp, params);
      return;
    }

    this.logger.warn(
      `No email provider configured (set RESEND_API_KEY or SMTP_*); skipping email to ${params.to} (${params.subject})`,
    );
  }

  private getSmtpConfig(): {
    configured: boolean;
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  } {
    const host = (this.configService.get<string>('SMTP_HOST') ?? '').trim();
    const portRaw = this.configService.get<number>('SMTP_PORT', 587);
    const port = Number.isFinite(portRaw) ? portRaw : 587;
    const user = (this.configService.get<string>('SMTP_USER') ?? '').trim();
    const password = (
      this.configService.get<string>('SMTP_PASSWORD') ?? ''
    ).trim();
    const from = (this.configService.get<string>('SMTP_FROM') ?? '').trim();

    const configured = host.length > 0 && from.length > 0;
    return { configured, host, port, user, password, from };
  }

  private async sendViaSmtp(
    smtp: {
      host: string;
      port: number;
      user: string;
      password: string;
      from: string;
    },
    params: {
      to: string;
      subject: string;
      html: string;
      text?: string;
    },
  ): Promise<void> {
    try {
      const nodemailer = await import('nodemailer');

      const secure = smtp.port === 465;
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure,
        // Fail fast on platforms that block outbound SMTP.
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 10_000,
        ...(smtp.user && smtp.password
          ? { auth: { user: smtp.user, pass: smtp.password } }
          : {}),
      });

      const result = await transporter.sendMail({
        from: smtp.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      const messageId = (result as { messageId?: string } | undefined)
        ?.messageId;
      this.logger.log(
        `Sent email (SMTP) to ${params.to} (${params.subject})${messageId ? ` id=${messageId}` : ''}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(
        `Failed to send email (SMTP) to ${params.to} (${params.subject}) from=${smtp.from}: ${message}`,
      );
    }
  }

  private async trySendViaResend(params: {
    apiKey: string;
    from: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ ok: true } | { ok: false; fallbackToSmtp: boolean }> {
    const { Resend } = await import('resend');
    const resend = new Resend(params.apiKey);

    const placeholderFrom = 'no-reply@marketplace.local';
    const resolvedFrom =
      params.from.length === 0 || params.from.toLowerCase() === placeholderFrom
        ? 'onboarding@resend.dev'
        : params.from;

    if (params.from.toLowerCase() === placeholderFrom) {
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

      const maybe = result as unknown as {
        data?: { id?: string } | null;
        error?: unknown;
      };

      if (maybe?.error) {
        const errorJson =
          maybe.error instanceof Error
            ? { message: maybe.error.message }
            : (maybe.error as Record<string, unknown>);
        const message =
          maybe.error instanceof Error
            ? maybe.error.message
            : JSON.stringify(maybe.error);

        const statusCode =
          typeof (errorJson as { statusCode?: unknown }).statusCode === 'number'
            ? (errorJson as { statusCode: number }).statusCode
            : undefined;
        const name =
          typeof (errorJson as { name?: unknown }).name === 'string'
            ? (errorJson as { name: string }).name
            : undefined;

        const fallbackToSmtp =
          statusCode === 403 &&
          name === 'validation_error' &&
          message.toLowerCase().includes('only send testing emails');

        this.logger.error(
          `Failed to send email to ${params.to} (${params.subject}) from=${resolvedFrom}: ${message}`,
        );

        if (fallbackToSmtp) {
          this.logger.warn(
            'Resend is in testing mode; configure a verified Resend domain or set SMTP_* for fallback sending.',
          );
        }

        return { ok: false, fallbackToSmtp };
      }

      const id = maybe?.data?.id;
      this.logger.log(
        `Sent email to ${params.to} (${params.subject})${id ? ` id=${id}` : ''}`,
      );
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(
        `Failed to send email to ${params.to} (${params.subject}) from=${resolvedFrom}: ${message}`,
      );
      return { ok: false, fallbackToSmtp: false };
    }
  }
}
