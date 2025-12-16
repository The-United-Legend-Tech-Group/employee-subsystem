import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CVRecordRepository } from '../repository/cv-record.repository';
import { GeminiService } from './gemini.service';
import { TextExtractionService } from './text-extraction.service';
import { CVStatus } from '../enums/cv-status.enum';
import { CVRecord } from '../models/cv-record.schema';

@Injectable()
export class AtsService {
  private readonly logger = new Logger(AtsService.name);
  private readonly cvStoragePath: string;

  constructor(
    private cvRecordRepository: CVRecordRepository,
    private geminiService: GeminiService,
    private textExtractionService: TextExtractionService,
  ) {
    // Set CV storage path (you can configure this in .env)
    this.cvStoragePath = path.join(
      process.cwd(),
      'src',
      'Recruitment',
      'ats',
      'cv',
    );
    this.ensureStorageDirectory();
  }

  private async ensureStorageDirectory() {
    try {
      await fs.access(this.cvStoragePath);
    } catch {
      await fs.mkdir(this.cvStoragePath, { recursive: true });
      this.logger.log(`Created CV storage directory: ${this.cvStoragePath}`);
    }
  }

  async uploadCV(
    file: Express.Multer.File,
    uploadedBy: string,
    candidateId?: string,
    applicationId?: string,
    jobDescription?: string,
  ): Promise<CVRecord> {
    try {
      this.logger.log(`Uploading CV: ${file.originalname}`);

      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${file.originalname}`;
      const filePath = path.join(this.cvStoragePath, uniqueFilename);

      // Save file to disk
      await fs.writeFile(filePath, file.buffer);

      // Create CV record in database
      const cvRecord = await this.cvRecordRepository.create({
        filename: file.originalname,
        storageUrl: filePath,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        uploadedBy: uploadedBy as any,
        candidateId: candidateId as any,
        applicationId: applicationId as any,
        status: CVStatus.PENDING,
        jobDescriptionId: jobDescription || undefined,
      });

      this.logger.log(`CV record created with ID: ${cvRecord._id}`);

      // Start async processing (non-blocking)
      this.processCV(cvRecord._id.toString(), jobDescription).catch((error) => {
        this.logger.error(`Background CV processing failed: ${error.message}`);
      });

      return cvRecord;
    } catch (error) {
      this.logger.error('CV upload failed:', error);
      throw error;
    }
  }

  async processCV(cvRecordId: string, jobDescription?: string): Promise<void> {
    try {
      this.logger.log(`Processing CV: ${cvRecordId}`);

      // Update status to processing
      await this.cvRecordRepository.updateStatus(
        cvRecordId,
        CVStatus.PROCESSING,
      );

      const cvRecord = await this.cvRecordRepository.findById(cvRecordId);
      if (!cvRecord) {
        throw new NotFoundException('CV record not found');
      }

      this.logger.log(
        `CV file path: ${cvRecord.storageUrl}, MIME: ${cvRecord.mimeType}`,
      );

      // Extract text from file
      const extractedText = await this.textExtractionService.extractText(
        cvRecord.storageUrl,
        cvRecord.mimeType,
      );

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error(
          'No text could be extracted from the CV. The file may be empty or contain only images.',
        );
      }

      // Store extracted text
      await this.cvRecordRepository.updateExtractedText(
        cvRecordId,
        extractedText,
      );

      this.logger.log(`Extracted ${extractedText.length} characters from CV`);

      // Analyze with Gemini
      this.logger.log('Sending to Gemini for analysis...');
      const analysis = await this.geminiService.analyzeCV(
        extractedText,
        jobDescription,
      );

      // Calculate final score
      const score = analysis.overallScore || 0;

      this.logger.log(`Gemini analysis received. Score: ${score}`);

      // Update with results
      await this.cvRecordRepository.updateAnalysis(cvRecordId, score, analysis);

      this.logger.log(
        `CV analysis completed successfully. Final Score: ${score}`,
      );
    } catch (error) {
      this.logger.error(`CV processing failed: ${error.message}`, error.stack);
      await this.cvRecordRepository.updateStatus(
        cvRecordId,
        CVStatus.FAILED,
        error.message || 'Unknown error during CV processing',
      );
      throw error; // Re-throw to help with debugging
    }
  }

  async getCVStatus(cvRecordId: string): Promise<CVRecord> {
    const cvRecord = await this.cvRecordRepository.findById(cvRecordId);
    if (!cvRecord) {
      throw new NotFoundException('CV record not found');
    }
    return cvRecord;
  }

  async getCVAnalysis(cvRecordId: string): Promise<CVRecord> {
    const cvRecord = await this.cvRecordRepository.findById(cvRecordId);
    if (!cvRecord) {
      throw new NotFoundException('CV record not found');
    }

    if (cvRecord.status !== CVStatus.COMPLETED) {
      throw new Error('CV analysis is not yet completed');
    }

    return cvRecord;
  }

  async getCVsByCandidateId(candidateId: string): Promise<CVRecord[]> {
    return this.cvRecordRepository.findByCandidateId(candidateId);
  }

  async getCVsByApplicationId(applicationId: string): Promise<CVRecord[]> {
    return this.cvRecordRepository.findByApplicationId(applicationId);
  }

  async getAllCVs(limit = 50, skip = 0): Promise<CVRecord[]> {
    return this.cvRecordRepository.findAll(limit, skip);
  }

  async reanalyzeCV(
    cvRecordId: string,
    jobDescription?: string,
  ): Promise<CVRecord> {
    const cvRecord = await this.cvRecordRepository.findById(cvRecordId);
    if (!cvRecord) {
      throw new NotFoundException('CV record not found');
    }

    // Reset status to pending
    await this.cvRecordRepository.updateStatus(cvRecordId, CVStatus.PENDING);

    // Start processing again
    await this.processCV(cvRecordId, jobDescription);

    const updatedRecord = await this.cvRecordRepository.findById(cvRecordId);
    if (!updatedRecord) {
      throw new NotFoundException('CV record not found after reanalysis');
    }
    return updatedRecord;
  }

  async deleteCV(cvRecordId: string): Promise<void> {
    const cvRecord = await this.cvRecordRepository.findById(cvRecordId);
    if (!cvRecord) {
      throw new NotFoundException('CV record not found');
    }

    // Delete file from disk
    try {
      await fs.unlink(cvRecord.storageUrl);
    } catch (error) {
      this.logger.warn(`Failed to delete file: ${error.message}`);
    }

    // Delete database record
    await this.cvRecordRepository.delete(cvRecordId);
  }
}
