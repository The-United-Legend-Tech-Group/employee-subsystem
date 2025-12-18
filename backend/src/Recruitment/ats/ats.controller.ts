import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Query,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AtsService } from './services/ats.service';
import { UploadCVDto } from './dto/upload-cv.dto';
import { CVAnalysisResponseDto } from './dto/cv-analysis-response.dto';
import { CVStatusResponseDto } from './dto/cv-status-response.dto';
import { ReanalyzeCVDto } from './dto/reanalyze-cv.dto';

@ApiTags('ATS - CV Analysis')
@Controller('recruitment/ats')
export class AtsController {
  constructor(private readonly atsService: AtsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload CV for AI-powered analysis',
    description:
      'Upload a CV file (PDF, DOCX, TXT) and get AI-powered scoring and suggestions using Google Gemini',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadCVDto })
  @ApiResponse({
    status: 201,
    description: 'CV uploaded successfully and processing started',
    type: CVAnalysisResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or request' })
  @HttpCode(HttpStatus.CREATED)
  async uploadCV(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadCVDto: UploadCVDto,
    @Query('uploadedBy') uploadedBy: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!uploadedBy) {
      throw new BadRequestException('uploadedBy query parameter is required');
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed',
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const cvRecord = await this.atsService.uploadCV(
      file,
      uploadedBy,
      uploadCVDto.candidateId,
      uploadCVDto.applicationId,
      uploadCVDto.jobDescription,
    );

    return {
      id: cvRecord._id.toString(),
      filename: cvRecord.filename,
      status: cvRecord.status,
      uploadedBy: cvRecord.uploadedBy,
      candidateId: cvRecord.candidateId,
      applicationId: cvRecord.applicationId,
      createdAt: cvRecord.createdAt,
      message: 'CV uploaded successfully. Analysis is in progress.',
    };
  }

  @Get(':id/status')
  @ApiOperation({
    summary: 'Get CV processing status',
    description:
      'Check the current status of CV analysis (pending, processing, completed, failed)',
  })
  @ApiParam({ name: 'id', description: 'CV Record ID' })
  @ApiResponse({
    status: 200,
    description: 'CV status retrieved',
    type: CVStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'CV record not found' })
  async getCVStatus(@Param('id') id: string) {
    const cvRecord = await this.atsService.getCVStatus(id);

    return {
      id: cvRecord._id.toString(),
      filename: cvRecord.filename,
      status: cvRecord.status,
      uploadedAt: cvRecord.createdAt,
      processedAt: cvRecord.processedAt,
      errorMessage: cvRecord.errorMessage,
    };
  }

  @Get(':id/analysis')
  @ApiOperation({
    summary: 'Get full CV analysis results',
    description:
      'Retrieve complete AI analysis including score, suggestions, strengths, and weaknesses',
  })
  @ApiParam({ name: 'id', description: 'CV Record ID' })
  @ApiResponse({
    status: 200,
    description: 'CV analysis retrieved',
    type: CVAnalysisResponseDto,
  })
  @ApiResponse({ status: 404, description: 'CV record not found' })
  @ApiResponse({ status: 400, description: 'Analysis not yet completed' })
  async getCVAnalysis(@Param('id') id: string) {
    const cvRecord = await this.atsService.getCVAnalysis(id);

    return {
      id: cvRecord._id.toString(),
      filename: cvRecord.filename,
      status: cvRecord.status,
      score: cvRecord.score,
      analysis: cvRecord.analysis,
      candidateId: cvRecord.candidateId?.toString(),
      applicationId: cvRecord.applicationId?.toString(),
      uploadedBy: cvRecord.uploadedBy.toString(),
      createdAt: cvRecord.createdAt,
      processedAt: cvRecord.processedAt,
    };
  }

  @Get('candidate/:candidateId')
  @ApiOperation({
    summary: 'Get all CVs for a candidate',
    description: 'Retrieve all CV records associated with a specific candidate',
  })
  @ApiParam({ name: 'candidateId', description: 'Candidate ID' })
  @ApiResponse({
    status: 200,
    description: 'List of CV records',
    type: [CVAnalysisResponseDto],
  })
  async getCVsByCandidateId(@Param('candidateId') candidateId: string) {
    const cvRecords = await this.atsService.getCVsByCandidateId(candidateId);

    return cvRecords.map((cv) => ({
      id: cv._id.toString(),
      filename: cv.filename,
      status: cv.status,
      score: cv.score,
      uploadedBy: cv.uploadedBy,
      createdAt: cv.createdAt,
      processedAt: cv.processedAt,
    }));
  }

  @Get('application/:applicationId')
  @ApiOperation({
    summary: 'Get all CVs for an application',
    description:
      'Retrieve all CV records associated with a specific job application',
  })
  @ApiParam({ name: 'applicationId', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'List of CV records',
    type: [CVAnalysisResponseDto],
  })
  async getCVsByApplicationId(@Param('applicationId') applicationId: string) {
    const cvRecords =
      await this.atsService.getCVsByApplicationId(applicationId);

    return cvRecords.map((cv) => ({
      id: cv._id.toString(),
      filename: cv.filename,
      status: cv.status,
      score: cv.score,
      candidateId: cv.candidateId?.toString(),
      uploadedBy: cv.uploadedBy,
      createdAt: cv.createdAt,
      processedAt: cv.processedAt,
    }));
  }

  @Get()
  @ApiOperation({
    summary: 'Get all CV records',
    description: 'Retrieve paginated list of all CV records in the system',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records to return (default: 50)',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of records to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of CV records',
    type: [CVAnalysisResponseDto],
  })
  async getAllCVs(@Query('limit') limit = 50, @Query('skip') skip = 0) {
    const cvRecords = await this.atsService.getAllCVs(+limit, +skip);

    return cvRecords.map((cv) => ({
      id: cv._id.toString(),
      filename: cv.filename,
      status: cv.status,
      score: cv.score,
      candidateId: cv.candidateId?.toString(),
      applicationId: cv.applicationId?.toString(),
      uploadedBy: cv.uploadedBy,
      createdAt: cv.createdAt,
      processedAt: cv.processedAt,
    }));
  }

  @Post(':id/reanalyze')
  @ApiOperation({
    summary: 'Re-analyze CV with updated job description',
    description:
      'Trigger a new analysis of the CV, optionally with an updated job description',
  })
  @ApiParam({ name: 'id', description: 'CV Record ID' })
  @ApiBody({ type: ReanalyzeCVDto })
  @ApiResponse({
    status: 200,
    description: 'Re-analysis started',
    type: CVStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'CV record not found' })
  async reanalyzeCV(
    @Param('id') id: string,
    @Body() reanalyzeCVDto: ReanalyzeCVDto,
  ) {
    const cvRecord = await this.atsService.reanalyzeCV(
      id,
      reanalyzeCVDto.jobDescription,
    );

    return {
      id: cvRecord._id.toString(),
      filename: cvRecord.filename,
      status: cvRecord.status,
      message: 'Re-analysis started',
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete CV record',
    description: 'Permanently delete a CV record and its associated file',
  })
  @ApiParam({ name: 'id', description: 'CV Record ID' })
  @ApiResponse({ status: 200, description: 'CV deleted successfully' })
  @ApiResponse({ status: 404, description: 'CV record not found' })
  @HttpCode(HttpStatus.OK)
  async deleteCV(@Param('id') id: string) {
    await this.atsService.deleteCV(id);
    return { message: 'CV deleted successfully' };
  }
}
