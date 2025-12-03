import { Controller, Post, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigBackupService } from './config-backup.service';
import { ConfigBackupSchedulerService } from './config-backup-scheduler.service';

@ApiTags('Config Backup')
@Controller('config-setup/backup')
export class ConfigBackupController {
  constructor(
    private readonly backupService: ConfigBackupService,
    private readonly schedulerService: ConfigBackupSchedulerService,
  ) {}

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger manual backup of config_setup collections' })
  @ApiResponse({ status: 200, description: 'Backup completed successfully' })
  @ApiResponse({ status: 500, description: 'Backup failed' })
  async triggerBackup(): Promise<{ message: string; timestamp: string }> {
    await this.schedulerService.triggerManualBackup();
    return {
      message: 'Backup completed successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('list')
  @ApiOperation({ summary: 'List all available backups' })
  @ApiResponse({ status: 200, description: 'List of available backups' })
  listBackups(): { backups: string[] } {
    const backups = this.backupService.listBackups();
    return { backups };
  }

  @Post('restore/:backupName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Restore from a specific backup',
    description: 'WARNING: This will replace all current data with the backup data'
  })
  @ApiResponse({ status: 200, description: 'Restore completed successfully' })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  @ApiResponse({ status: 500, description: 'Restore failed' })
  async restoreBackup(
    @Param('backupName') backupName: string,
  ): Promise<{ message: string; timestamp: string }> {
    await this.backupService.restoreBackup(backupName);
    return {
      message: `Restored from backup: ${backupName}`,
      timestamp: new Date().toISOString(),
    };
  }
}
