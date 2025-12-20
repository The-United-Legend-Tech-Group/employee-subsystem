import {
  Controller,
  Post,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigBackupService } from './config-backup.service';
import { ConfigBackupSchedulerService } from './config-backup-scheduler.service';
import { AuthGuard } from '../../common/guards/authentication.guard';
import { authorizationGuard } from '../../common/guards/authorization.guard';
import { SystemRole } from '../../employee-subsystem/employee/enums/employee-profile.enums';
import { Roles as SystemRoles } from '../../employee-subsystem/employee/decorators/roles.decorator';

const Roles = (...roles: SystemRole[]) => SystemRoles(...(roles as any));

@ApiTags('Config Backup')
@ApiBearerAuth()
@UseGuards(AuthGuard, authorizationGuard)
@Controller('config-setup/backup')
export class ConfigBackupController {
  constructor(
    private readonly backupService: ConfigBackupService,
    private readonly schedulerService: ConfigBackupSchedulerService,
  ) { }

  @Post('trigger')
  @Roles(SystemRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger manual backup of config_setup collections',
  })
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
  @Roles(SystemRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'List all available backups' })
  @ApiResponse({ status: 200, description: 'List of available backups' })
  listBackups(): { backups: string[] } {
    const backups = this.backupService.listBackups();
    return { backups };
  }

  @Post('restore/:backupName')
  @Roles(SystemRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore from a specific backup',
    description:
      'WARNING: This will replace all current data with the backup data',
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

  @Get('download/:backupName')
  @Roles(SystemRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Download a backup as JSON' })
  @ApiResponse({ status: 200, description: 'Backup file download' })
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="backup.json"')
  async downloadBackup(@Param('backupName') backupName: string) {
    return this.backupService.getBackupData(backupName);
  }
}
