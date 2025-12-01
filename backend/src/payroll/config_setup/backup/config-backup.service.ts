import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ConfigBackupService {
  private readonly logger = new Logger(ConfigBackupService.name);
  private backupDir: string;

  constructor(@InjectConnection() private readonly connection: Connection) {
    // Store backups outside src folder to prevent data loss during deployment
    this.backupDir = path.join(
      process.cwd(),
      'backups',
      'config_setup',
    );

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.logger.log(`📁 Created backup directory: ${this.backupDir}`);
    }
  }

  async backupConfigSetup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}`);

    // MongoDB backup for payroll/config_setup collections
    const collections = [
      'allowances',
      'payrollpolicies',
      'companywidesettings',
      'insurancebrackets',
      'paygrades',
      'paytypes',
      'signingbonus',
      'taxrules',
      'terminationandresignationbenefits',
    ];

    this.logger.log(`📦 Starting backup to: ${backupPath}`);
    this.logger.log(`📋 Collections: ${collections.join(', ')}`);
    this.logger.log(
      `🗄️  Database: ${this.connection.db?.databaseName || 'unknown'}`,
    );

    // Create backup directory
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    const results = {
      successful: [] as string[],
      failed: [] as string[],
    };

    try {
      await this.directMongoExport(backupPath, collections, results);
    } catch (error) {
      this.logger.error(`❌ Backup failed: ${(error as Error).message}`);
      throw error;
    }

    // Log summary
    this.logger.log('✨ Backup completed');
    this.logger.log(
      `✅ Successful: ${results.successful.length}/${collections.length}`,
    );
    if (results.failed.length > 0) {
      this.logger.warn(`❌ Failed: ${results.failed.join(', ')}`);
    }
    this.logger.log(`📁 Location: ${backupPath}`);

    // Cleanup old backups (keep last 7)
    this.cleanOldBackups(7);
  }

  private async directMongoExport(
    backupPath: string,
    collections: string[],
    results: { successful: string[]; failed: string[] },
  ): Promise<void> {
    if (!this.connection.db) {
      throw new Error('Database connection not available');
    }

    // Map collection names to actual Mongoose collection names
    const collectionMap: Record<string, string> = {};
    for (const modelName of this.connection.modelNames()) {
      const model = this.connection.model(modelName);
      const actualCollectionName = model.collection.name;
      const requestedName = collections.find(
        (c) => c.toLowerCase() === actualCollectionName.toLowerCase(),
      );
      if (requestedName) {
        collectionMap[requestedName] = actualCollectionName;
      }
    }

    // Export each collection as JSON using direct MongoDB connection
    for (const collectionName of collections) {
      try {
        const actualName = collectionMap[collectionName] || collectionName;
        const collection = this.connection.db.collection(actualName);
        const documents = await collection.find({}).toArray();

        const outputFile = path.join(backupPath, `${collectionName}.json`);
        fs.writeFileSync(
          outputFile,
          JSON.stringify(documents, null, 2),
          'utf-8',
        );

        results.successful.push(collectionName);
        this.logger.log(
          `✅ Exported ${collectionName} (${documents.length} documents)`,
        );
      } catch (error) {
        results.failed.push(collectionName);
        this.logger.error(
          `❌ Failed to export ${collectionName}: ${(error as Error).message}`,
        );
      }
    }
  }

  private cleanOldBackups(maxBackups: number): void {
    try {
      const backups = fs
        .readdirSync(this.backupDir)
        .filter((name) => name.startsWith('backup-'))
        .map((name) => ({
          name,
          path: path.join(this.backupDir, name),
          time: fs.statSync(path.join(this.backupDir, name)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      const toDelete = backups.slice(maxBackups);

      for (const backup of toDelete) {
        fs.rmSync(backup.path, { recursive: true, force: true });
        this.logger.log(`🗑️  Deleted old backup: ${backup.name}`);
      }

      if (toDelete.length > 0) {
        this.logger.log(`🧹 Cleaned up ${toDelete.length} old backup(s)`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to clean old backups: ${(error as Error).message}`,
      );
    }
  }

  async restoreBackup(backupName: string): Promise<void> {
    const backupPath = path.join(this.backupDir, backupName);

    if (!fs.existsSync(backupPath)) {
      throw new NotFoundException(`Backup not found: ${backupName}`);
    }

    this.logger.log(`📥 Restoring backup from: ${backupPath}`);

    const files = fs.readdirSync(backupPath).filter((f) => f.endsWith('.json'));

    if (files.length === 0) {
      throw new Error('No JSON backup files found');
    }

    for (const file of files) {
      const collectionName = file.replace('.json', '');
      const filePath = path.join(backupPath, file);

      try {
        if (!this.connection.db) {
          throw new Error('Database connection not available');
        }

        const data = JSON.parse(
          fs.readFileSync(filePath, 'utf-8'),
        ) as unknown[];
        const collection = this.connection.db.collection(collectionName);

        // Clear existing data
        await collection.deleteMany({});

        // Insert backup data
        if (Array.isArray(data) && data.length > 0) {
          await collection.insertMany(data as never[]);
        }

        this.logger.log(
          `✅ Restored ${collectionName} (${Array.isArray(data) ? data.length : 0} documents)`,
        );
      } catch (error) {
        this.logger.error(
          `❌ Failed to restore ${collectionName}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log('✨ Restore completed');
  }

  listBackups(): string[] {
    return fs
      .readdirSync(this.backupDir)
      .filter((name) => name.startsWith('backup-'))
      .sort()
      .reverse();
  }
}
