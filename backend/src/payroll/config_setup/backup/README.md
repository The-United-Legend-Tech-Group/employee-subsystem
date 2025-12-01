# Config Setup Backup System

Automated backup system for payroll configuration data using direct MongoDB export.

## Features

- **Automated Scheduled Backups**: Runs every minute (configurable via cron expression)
- **Manual Backup Trigger**: POST endpoint to trigger backups on-demand
- **Direct MongoDB Export**: Uses Mongoose connection for reliable JSON exports
- **Automatic Cleanup**: Keeps last 7 backups, removes older ones
- **Restore Capability**: Restore from any previous backup

## Backup Method

The system uses **Direct MongoDB Export** via Mongoose connection:
- Always available (no external tools required)
- JSON format (human-readable and version-control friendly)
- Maps Mongoose model names to actual collection names automatically
- Exports all documents with proper formatting

## API Endpoints

### Trigger Manual Backup
```http
POST /config-setup/backup/trigger
```

**Response:**
```json
{
  "message": "Backup completed successfully",
  "timestamp": "2024-12-01T06-23-00-021Z",
  "location": "/path/to/backup"
}
```

### List Available Backups
```http
GET /config-setup/backup/list
```

**Response:**
```json
{
  "backups": [
    "backup-2024-12-01T06-23-00-021Z",
    "backup-2024-12-01T06-17-00-016Z"
  ]
}
```

### Restore Backup
```http
POST /config-setup/backup/restore/:backupName
```

**Parameters:**
- `backupName`: Name of the backup folder (e.g., `backup-2024-12-01T06-23-00-021Z`)

**Response:**
```json
{
  "message": "Backup restored successfully",
  "backupName": "backup-2024-12-01T06-23-00-021Z"
}
```

## Backup Schedule

The default schedule is **every minute** (for testing). Modify in `config-backup-scheduler.service.ts`:

```typescript
@Cron('* * * * *') // Every minute (current)
// Change to:
@Cron('0 0 * * *') // Daily at midnight
@Cron('0 */6 * * *') // Every 6 hours
@Cron('0 2 * * 0') // Weekly on Sunday at 2 AM
```

## Backup Location

Backups are stored outside the src folder (not included in compiled dist/):

```
backend/backups/config_setup/
├── backup-2024-12-01T06-23-00-021Z/
│   ├── allowances.json
│   ├── payrollpolicies.json
│   ├── companywidesettings.json
│   ├── insurancebrackets.json
│   ├── paygrades.json
│   ├── paytypes.json
│   ├── signingbonus.json
│   ├── taxrules.json
│   └── terminationandresignationbenefits.json
```

Each backup contains JSON files for all 9 configuration collections.

## Backup Retention

- **Retention Policy**: Keeps last 7 backups
- **Auto Cleanup**: Runs after each backup
- **Manual Override**: Adjust `maxBackups` parameter in `backupConfigSetup()` method

## Collections Backed Up

1. **allowances** - Employee allowances configuration
2. **payrollpolicies** - Payroll policies and rules
3. **companywidesettings** - Company-wide payroll settings
4. **insurancebrackets** - Insurance bracket definitions
5. **paygrades** - Pay grade structures
6. **paytypes** - Payment type configurations
7. **signingbonus** - Signing bonus settings
8. **taxrules** - Tax calculation rules
9. **terminationandresignationbenefits** - Termination/resignation benefit rules

## Monitoring

Check application logs for backup status:

```
[ConfigBackupSchedulerService] 🔄 Starting scheduled config_setup backup...
[ConfigBackupService] 📦 Starting backup to: /path/to/backup
[ConfigBackupService] 📋 Collections: allowances, payrollpolicies, ...
[ConfigBackupService] 🗄️  Database: payroll-test
[ConfigBackupService] ✅ Exported allowances (3 documents)
[ConfigBackupService] ✅ Exported payrollpolicies (5 documents)
...
[ConfigBackupService] ✨ Backup completed
[ConfigBackupService] ✅ Successful: 9/9
[ConfigBackupService] 📁 Location: /path/to/backup
[ConfigBackupService] 🧹 Cleaned up 2 old backup(s)
```

## Error Handling

- **Failed Exports**: Logged but don't stop the backup process
- **Collection Mapping**: Automatically maps Mongoose model names to MongoDB collection names
- **Missing Collections**: Logs warning if collection not found
- **Restore Validation**: Checks backup exists before restoring
- **Data Validation**: Validates JSON format before inserting

## Testing

Run backup tests with:
```bash
npm run test:e2e -- test/config-setup.e2e-spec.ts
```

## Notes

- Backups are stored outside `src/` folder to prevent data loss during deployment
- Location: `backend/backups/config_setup/` (excluded from git via .gitignore)
- JSON format makes backups easy to inspect and version control
- No external MongoDB tools required
- Works with any MongoDB version supported by Mongoose
