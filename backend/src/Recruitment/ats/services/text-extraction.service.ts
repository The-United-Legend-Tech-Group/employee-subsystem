import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';

@Injectable()
export class TextExtractionService {
  private readonly logger = new Logger(TextExtractionService.name);

  async extractText(filePath: string, mimeType: string): Promise<string> {
    try {
      this.logger.log(`Extracting text from ${mimeType} file: ${filePath}`);

      if (mimeType === 'application/pdf') {
        return await this.extractFromPDF(filePath);
      } else if (
        mimeType ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        return await this.extractFromDOCX(filePath);
      } else if (mimeType.startsWith('text/')) {
        return await this.extractFromText(filePath);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      this.logger.error('Text extraction failed:', error);
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  private async extractFromPDF(filePath: string): Promise<string> {
    try {
      this.logger.log(`Attempting to extract text from PDF: ${filePath}`);
      const pdfParse = require('pdf-parse');
      const dataBuffer = await fs.readFile(filePath);
      
      if (dataBuffer.length === 0) {
        throw new Error('PDF file is empty');
      }
      
      const data = await pdfParse(dataBuffer);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF contains no extractable text. It may be a scanned image or empty.');
      }
      
      this.logger.log(`Successfully extracted ${data.text.length} characters from PDF`);
      return data.text;
    } catch (error) {
      this.logger.error('PDF extraction error:', error);
      if (error.message?.includes('Invalid PDF')) {
        throw new Error('Invalid or corrupted PDF file');
      }
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  private async extractFromDOCX(filePath: string): Promise<string> {
    try {
      this.logger.log(`Attempting to extract text from DOCX: ${filePath}`);
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('DOCX contains no extractable text');
      }
      
      this.logger.log(`Successfully extracted ${result.value.length} characters from DOCX`);
      return result.value;
    } catch (error) {
      this.logger.error('DOCX extraction error:', error);
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  private async extractFromText(filePath: string): Promise<string> {
    try {
      this.logger.log(`Reading text file: ${filePath}`);
      const content = await fs.readFile(filePath, 'utf-8');
      
      if (!content || content.trim().length === 0) {
        throw new Error('Text file is empty');
      }
      
      this.logger.log(`Successfully read ${content.length} characters from text file`);
      return content;
    } catch (error) {
      this.logger.error('Text extraction error:', error);
      throw new Error(`Failed to read text file: ${error.message}`);
    }
  }
}
