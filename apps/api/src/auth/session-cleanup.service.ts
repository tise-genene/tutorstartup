import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionCleanupService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    const processRole = (process.env.PROCESS_ROLE ?? 'api').toLowerCase();
    const shouldRunInThisProcess =
      processRole === 'worker' || processRole === 'all';
    if (!shouldRunInThisProcess) {
      return;
    }

    if (!this.isEnabled()) {
      return;
    }

    const intervalMinutes = this.getIntervalMinutes();
    const intervalMs = intervalMinutes * 60 * 1000;

    // Run once on startup, then on interval.
    void this.cleanupOnce();
    this.timer = setInterval(() => void this.cleanupOnce(), intervalMs);
    this.timer.unref?.();

    this.logger.log(
      `Session cleanup scheduled every ${intervalMinutes} minutes`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private isEnabled(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const raw = this.configService.get<string>('SESSION_CLEANUP_ENABLED');

    if (!raw || raw.trim().length === 0) {
      return nodeEnv === 'production';
    }

    return ['true', '1', 'yes', 'y', 'on'].includes(raw.toLowerCase());
  }

  private getIntervalMinutes(): number {
    const raw = this.configService.get<number>(
      'SESSION_CLEANUP_INTERVAL_MINUTES',
    );
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
      return raw;
    }
    return 60;
  }

  private getRetentionDays(): number {
    const raw = this.configService.get<number>(
      'SESSION_CLEANUP_RETENTION_DAYS',
    );
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
      return raw;
    }
    return 30;
  }

  private async cleanupOnce(): Promise<void> {
    const retentionDays = this.getRetentionDays();
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: cutoff } }, { revokedAt: { lt: cutoff } }],
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `Deleted ${result.count} old sessions (cutoff=${cutoff.toISOString()})`,
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Session cleanup failed', err.stack);
    }
  }
}
