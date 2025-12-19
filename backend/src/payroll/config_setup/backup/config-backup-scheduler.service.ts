import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigBackupService } from './config-backup.service';

@Injectable()
export class ConfigBackupSchedulerService {
  private readonly logger = new Logger(ConfigBackupSchedulerService.name);
  private isBackupRunning = false;

  constructor(private backupService: ConfigBackupService) {}

  // Runs every day at 2 AM (production schedule)
  // Change to '0 2 * * *' for testing (every minute: '* * * * *') for Developement
  @Cron('*/10 * * * *', {
    name: 'config-setup-daily-backup',
    timeZone: 'Africa/Cairo', // Adjust to your timezone
  })
  async handleDailyBackup(): Promise<void> {
    // Prevent overlapping backups
    if (this.isBackupRunning) {
      this.logger.warn('⏭️  Skipping backup - previous backup still running');
      return;
    }

    try {
      this.isBackupRunning = true;
      this.logger.log('🔄 Starting scheduled config_setup backup...');

      await this.backupService.backupConfigSetup();

      this.logger.log('✅ Scheduled backup completed successfully');
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `❌ Scheduled backup failed: ${err.message}`,
        err.stack,
      );
    } finally {
      this.isBackupRunning = false;
    }
  }

  // Manual backup trigger (can be called via API endpoint)
  async triggerManualBackup(): Promise<void> {
    if (this.isBackupRunning) {
      throw new Error('Backup already in progress');
    }

    this.logger.log('🔄 Manual backup triggered...');
    await this.handleDailyBackup();
  }
}
