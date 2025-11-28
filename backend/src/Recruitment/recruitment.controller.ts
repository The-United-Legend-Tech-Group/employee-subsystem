import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RecruitmentService } from './recruitment.service';
import { JobTemplateDocument } from './models/job-template.schema';
import { JobRequisitionDocument } from './models/job-requisition.schema';
import { DocumentDocument } from './models/document.schema';
import { ApplicationDocument } from './models/application.schema';

import { CreateJobTemplateDto } from './dtos/create-job-template.dto';
import { CreateJobRequisitionDto } from './dtos/create-job-requisition.dto';
import { UpdateJobRequisitionDto } from './dtos/update-jobrequisition.dto';
import { CreateCVDocumentDto } from './dtos/create-cv-document.dto';
import { CreateApplicationDto } from './dtos/create-application.dto';
import { UpdateApplicationDto } from './dtos/update-application.dto';

@ApiTags('Recruitment')
@Controller()
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get()
  getHello(): string {
    return this.recruitmentService.getHello();
  }
  //REC-003
  @ApiOperation({ summary: 'Create a new job template' })
  @ApiBody({ type: CreateJobTemplateDto })
  @ApiResponse({
    status: 201,
    description: 'Job template created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Post('createTemplate')
  async createJobTemplate(
    @Body() CreateJobTemplateDto: CreateJobTemplateDto,
  ): Promise<JobTemplateDocument> {
    return await this.recruitmentService.createjob_template(
      CreateJobTemplateDto,
    );
  }

  @ApiOperation({ summary: 'Create a new job requisition' })
  @ApiBody({ type: CreateJobRequisitionDto })
  @ApiResponse({
    status: 201,
    description: 'Job requisition created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Job template not found' })
  @Post('Requisition')
  async createJobRequisition(
    @Body() CreateJobRequisitionDto: CreateJobRequisitionDto,
  ): Promise<JobRequisitionDocument> {
    return await this.recruitmentService.createjob_requision(
      CreateJobRequisitionDto,
    );
  }

  //HELPS IN Doing REC-0023
  @ApiOperation({ summary: 'Update job requisition by ID' })
  @ApiParam({
    name: 'requisitionid',
    description: 'Job requisition ID',
    example: 'REQ-2024-001',
  })
  @ApiBody({ type: UpdateJobRequisitionDto })
  @ApiResponse({
    status: 200,
    description: 'Job requisition updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Job requisition not found' })
  @Patch('Rrequisition/:requisitionid')
  async updateJobRequision(
    @Param('requisitionid') id: string,
    @Body() UpdateJobRequisitionDto: UpdateJobRequisitionDto,
  ): Promise<JobRequisitionDocument> {
    return await this.recruitmentService.updatejob_requisition(
      id,
      UpdateJobRequisitionDto,
    );
  }
  //REC-0023
  @ApiOperation({ summary: 'Get all published job requisitions' })
  @ApiResponse({
    status: 200,
    description: 'List of published job requisitions',
    type: [Object],
  })
  @Get('Requisition/published')
  async getAllPublishedRequistions(): Promise<JobRequisitionDocument[]> {
    return await this.recruitmentService.getAllpublishedJobRequisition();
  }

  //REC-007
  @ApiOperation({ summary: 'Upload CV document' })
  @ApiBody({ type: CreateCVDocumentDto })
  @ApiResponse({
    status: 201,
    description: 'CV document uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid document data' })
  @Post('CVdocument')
  async uploadDocument(
    @Body() documentDto: CreateCVDocumentDto,
  ): Promise<DocumentDocument> {
    return this.recruitmentService.createCVDocument(documentDto);
  }

  //REC-007
  @ApiOperation({ summary: 'Create a new job application' })
  @ApiBody({ type: CreateApplicationDto })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid application data' })
  @ApiResponse({ status: 404, description: 'Job requisition not found' })
  @Post('Application')
  async createApplication(
    @Body() createApplicationDto: CreateApplicationDto,
  ): Promise<ApplicationDocument> {
    return this.recruitmentService.createApplication(createApplicationDto);
  }
  //REC-017 part 1
  @ApiOperation({ summary: 'Get all applications for a specific candidate' })
  @ApiParam({
    name: 'candidateId',
    description: 'Candidate MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'List of candidate applications',
    type: [Object],
  })
  @ApiResponse({ status: 400, description: 'Invalid candidate ID format' })
  @Get('Application/:candidateId')
  async getApplicationsByCandidate(
    @Param('candidateId') candidateId: string,
  ): Promise<ApplicationDocument[]> {
    return this.recruitmentService.getallcandidateApplications(candidateId);
  }

  //REC-017 part 2: Update Application Status/Stage
  @ApiOperation({ summary: 'Update application status and stage' })
  @ApiParam({
    name: 'candidateId',
    description: 'Candidate MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'requisitionId',
    description: 'Job requisition ID (user-defined)',
    example: 'REQ-2024-001',
  })
  @ApiBody({ type: UpdateApplicationDto })
  @ApiResponse({
    status: 200,
    description: 'Application updated successfully and history recorded',
  })
  @ApiResponse({
    status: 404,
    description: 'Application or job requisition not found',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Patch('Application/:candidateId/:requisitionId')
  async updateApplication(
    @Param('candidateId') candidateId: string,
    @Param('requisitionId') requisitionId: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ): Promise<ApplicationDocument> {
    return this.recruitmentService.updateApplication(
      candidateId,
      requisitionId,
      updateApplicationDto,
    );
  }
}
