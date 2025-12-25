import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ConfigBackupService {
  private readonly logger = new Logger(ConfigBackupService.name);
  private backupDir: string;

  // 🔒 SECURITY: This is your boundary.
  // Operations will strictly fail if they attempt to touch anything else.
  private readonly ALLOWED_COLLECTIONS = [
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

  constructor(@InjectConnection() private readonly connection: Connection) {
    this.backupDir = path.join(process.cwd(), 'backups', 'config_setup');

    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.logger.log(`📁 Created backup directory: ${this.backupDir}`);
    }
  }

  async backupConfigSetup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}`);

    this.logger.log(`📦 Starting backup to: ${backupPath}`);
    this.logger.log(
      `🗄️ Connected Database: ${this.connection.name || 'unknown'}`,
    );

    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    const results = {
      successful: [] as string[],
      failed: [] as string[],
    };

    try {
      // Pass the ALLOWED list. The export function will only look for these.
      await this.directMongoExport(
        backupPath,
        this.ALLOWED_COLLECTIONS,
        results,
      );
    } catch (error) {
      this.logger.error(
        `❌ Backup critical failure: ${(error as Error).message}`,
      );
      throw error;
    }

    this.logger.log('✨ Backup process finished');
    this.logger.log(
      `✅ Successful: ${results.successful.length}/${this.ALLOWED_COLLECTIONS.length}`,
    );

    if (results.failed.length > 0) {
      this.logger.warn(`❌ Failed/Empty: ${results.failed.join(', ')}`);
    }

    this.cleanOldBackups(7);
  }

  private async directMongoExport(
    backupPath: string,
    targetCollections: string[],
    results: { successful: string[]; failed: string[] },
  ): Promise<void> {
    if (!this.connection.db) {
      throw new Error('Database connection not available');
    }

    const dbCollections = await this.connection.db.listCollections().toArray();
    const dbCollectionNames = dbCollections.map((c) => c.name);

    this.logger.log(`🔎 Found in DB: ${dbCollectionNames.join(', ')}`);

    for (const targetName of targetCollections) {
      try {
        const realCollectionName = dbCollectionNames.find(
          (dbName) => dbName.toLowerCase() === targetName.toLowerCase(),
        );

        if (!realCollectionName) {
          this.logger.warn(
            `⚠️ Collection '${targetName}' not found in database. Skipping.`,
          );
          results.failed.push(targetName);
          continue;
        }

        const collection = this.connection.db.collection(realCollectionName);
        const documents = await collection.find({}).toArray();

        const outputFile = path.join(backupPath, `${targetName}.json`);
        fs.writeFileSync(
          outputFile,
          JSON.stringify(documents, null, 2),
          'utf-8',
        );

        if (documents.length > 0) {
          results.successful.push(targetName);
          this.logger.log(
            `✅ Exported ${realCollectionName} -> ${targetName}.json (${documents.length} docs)`,
          );
        } else {
          this.logger.warn(
            `⚠️ Exported ${realCollectionName} but it was empty (0 docs)`,
          );
          results.successful.push(targetName);
        }
      } catch (error) {
        results.failed.push(targetName);
        this.logger.error(
          `❌ Error exporting ${targetName}: ${(error as Error).message}`,
        );
      }
    }
  }

  private cleanOldBackups(maxBackups: number): void {
    try {
      if (!fs.existsSync(this.backupDir)) return;

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
        this.logger.log(`🗑️ Deleted old backup: ${backup.name}`);
      }
    } catch (error) {
      this.logger.error(`Cleanup failed: ${(error as Error).message}`);
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

    // Pre-fetch DB collections once to avoid querying inside the loop
    if (!this.connection.db)
      throw new Error('Database connection not available');
    const dbCollections = await this.connection.db.listCollections().toArray();

    for (const file of files) {
      const targetName = file.replace('.json', '');

      // 🔒 SECURITY CHECK 🔒
      // If the file is not in our specific ALLOWED list, skip it immediately.
      // This prevents 'users.json' or 'admin.json' from being restored.
      if (!this.ALLOWED_COLLECTIONS.includes(targetName)) {
        this.logger.warn(
          `🛑 SECURITY: Skipping restoration of '${targetName}' - it is outside your allowed boundary.`,
        );
        continue;
      }

      const filePath = path.join(backupPath, file);

      try {
        const realCollectionName =
          dbCollections.find(
            (c) => c.name.toLowerCase() === targetName.toLowerCase(),
          )?.name || targetName;

        let data = JSON.parse(
          fs.readFileSync(filePath, 'utf-8'),
        ) as unknown[];

        // Recursively convert strings to ObjectIds
        data = this.convertToObjectId(data) as unknown[];

        const collection = this.connection.db.collection(realCollectionName);

        // Safe to proceed because we passed the Security Check
        await collection.deleteMany({});

        if (Array.isArray(data) && data.length > 0) {
          await collection.insertMany(data as never[]);
        }

        this.logger.log(
          `✅ Restored ${realCollectionName} (${Array.isArray(data) ? data.length : 0} documents)`,
        );
      } catch (error) {
        this.logger.error(
          `❌ Failed to restore ${targetName}: ${(error as Error).message}`,
        );
      }
    }
    this.logger.log('✨ Restore completed');
  }

  listBackups(): string[] {
    if (!fs.existsSync(this.backupDir)) return [];
    return fs
      .readdirSync(this.backupDir)
      .filter((name) => name.startsWith('backup-'))
      .sort()
      .reverse();
  }
  async getBackupData(backupName: string): Promise<Record<string, any>> {
    const backupPath = path.join(this.backupDir, backupName);

    if (!fs.existsSync(backupPath)) {
      throw new NotFoundException(`Backup not found: ${backupName}`);
    }

    const files = fs.readdirSync(backupPath).filter((f) => f.endsWith('.json'));
    const backupData: Record<string, any> = {
      backupName,
      timestamp: new Date().toISOString(),
      collections: {},
    };

    for (const file of files) {
      const collectionName = file.replace('.json', '');
      try {
        const filePath = path.join(backupPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        backupData.collections[collectionName] = data;
      } catch (error) {
        this.logger.error(
          `Failed to read file ${file} in backup ${backupName}: ${(error as Error).message}`,
        );
        backupData.collections[collectionName] = { error: 'Failed to read data' };
      }
    }

    return backupData;
  }

  private convertToObjectId(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.convertToObjectId(item));
    } else if (data !== null && typeof data === 'object') {
      // Handle MongoDB extended JSON format if present (e.g. $oid)
      if (data.$oid) {
        return new Types.ObjectId(data.$oid);
      }

      const result: any = {};
      for (const key of Object.keys(data)) {
        const value = data[key];

        // Heuristic: If key is _id or ends with Id/By/At (though At is usually date), 
        // and value matches ObjectId pattern, convert it.
        // explicitly handling _id, and foreign keys often ending in Id or By (like createdBy)
        if (
          (key === '_id' || key.endsWith('Id') || key.endsWith('By')) &&
          typeof value === 'string' &&
          /^[0-9a-fA-F]{24}$/.test(value)
        ) {
          try {
            result[key] = new Types.ObjectId(value);
          } catch {
            // Fallback if somehow invalid
            result[key] = value;
          }
        } else {
          result[key] = this.convertToObjectId(value);
        }
      }
      return result;
    }
    return data;
  }
}
