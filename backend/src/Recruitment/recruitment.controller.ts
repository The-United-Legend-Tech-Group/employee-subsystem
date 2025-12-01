import { Controller, Post, Get, Patch, Body, UseInterceptors, UploadedFiles, Param } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RecruitmentService } from './recruitment.service';
import { UploadSignedContractDto } from './DTO/upload-signed-contract.dto';
import { UploadComplianceDocumentsDto } from './DTO/upload-compliance-documents.dto';
import { HrSignContractDto } from './DTO/hr-sign-contract.dto';
import { CreateOnboardingChecklistDto } from './DTO/create-onboarding-checklist.dto';
import { CreateOnboardingWithDefaultsDto } from './DTO/create-onboarding-with-defaults.dto';
import { GetOnboardingChecklistDto } from './DTO/get-onboarding-checklist.dto';
import { SendOnboardingReminderDto } from './DTO/send-onboarding-reminder.dto';
import { UpdateTaskStatusDto } from './DTO/update-task-status.dto';
import { CancelOnboardingDto } from './DTO/cancel-onboarding.dto';
import { CreateOfferDto } from './DTO/create-offer.dto';
import { AddOfferApproverDto } from './DTO/add-offer-approver.dto';
import { ApproveOfferDto } from './DTO/approve-offer.dto';
import { SendOfferDto } from './DTO/send-offer.dto';
import { CandidateRespondOfferDto } from './DTO/candidate-respond-offer.dto';
//

import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { JobTemplateDocument } from './models/job-template.schema';
import { JobRequisitionDocument } from './models/job-requisition.schema';
import { DocumentDocument } from './models/document.schema';
import { ApplicationDocument } from './models/application.schema';
import { InterviewDocument } from './models/interview.schema';


import { CreateJobTemplateDto } from './dtos/create-job-template.dto';
import { CreateJobRequisitionDto } from './dtos/create-job-requisition.dto';
import { UpdateJobRequisitionDto } from './dtos/update-jobrequisition.dto';
import { CreateCVDocumentDto } from './dtos/create-cv-document.dto';
import { CreateApplicationDto } from './dtos/create-application.dto';
import { UpdateApplicationDto } from './dtos/update-application.dto';
import { CreateInterviewDto } from './dtos/create-interview.dto';
import { UpdateInterviewDto } from './dtos/Update-interview.dto';
import { SendNotificationDto } from './dtos/send-notification.dto';
import { CreateReferralDto } from './dtos/create-referral.dto';
import { ReferralDocument } from './models/referral.schema';


@ApiTags('Recruitment')
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) { }

  @Post('offer/create')
  async createOffer(@Body() dto: CreateOfferDto) {
    return this.recruitmentService.createOffer(dto);
  }

  @Post('offer/add-approver')
  async addOfferApprover(@Body() dto: AddOfferApproverDto) {
    return this.recruitmentService.addOfferApprover(dto);
  }

  @Post('offer/approve')
  async approveOffer(@Body() dto: ApproveOfferDto) {
    return this.recruitmentService.approveOffer(dto);
  }

  @Post('offer/send')
  async sendOffer(@Body() dto: SendOfferDto) {
    return this.recruitmentService.sendOffer(dto);
  }

  @Post('offer/candidate-respond')
  async candidateRespondOffer(@Body() dto: CandidateRespondOfferDto) {
    return this.recruitmentService.candidateRespondOffer(dto);
  }

  @Post('contract/sign')
  @UseInterceptors(FilesInterceptor('files'))
  async signContract(
    @Body() dto: UploadSignedContractDto,
    @UploadedFiles() files: any[]
  ) {
    return this.recruitmentService.signContract(dto, files);
  }

  @Post('contract/hr-sign')
  async hrSignContract(@Body() dto: HrSignContractDto) {
    return this.recruitmentService.hrSignContract(dto);
  }

  @Post('documents/upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadComplianceDocuments(
    @Body() dto: UploadComplianceDocumentsDto,
    @UploadedFiles() files: any[]
  ) {
    return this.recruitmentService.uploadComplianceDocuments(dto, files);
  }

  @Post('onboarding/checklist')
  async createOnboardingChecklist(@Body() dto: CreateOnboardingChecklistDto) {
    return this.recruitmentService.createOnboardingChecklist(dto);
  }

  @Post('onboarding/checklist/defaults')
  async createOnboardingWithDefaults(@Body() dto: CreateOnboardingWithDefaultsDto) {
    return this.recruitmentService.createOnboardingWithDefaults(dto);
  }

  @Get('onboarding/checklist')
  async getOnboardingChecklist(@Body() dto: GetOnboardingChecklistDto) {
    return this.recruitmentService.getOnboardingChecklist(dto);
  }

  @Post('onboarding/reminders')
  async sendOnboardingReminders(@Body() dto: SendOnboardingReminderDto) {
    return this.recruitmentService.sendOnboardingReminders(dto);
  }

  @Post('onboarding/reminders/all')
  async sendAllOnboardingReminders(@Body() body: { daysBeforeDeadline?: number }) {
    return this.recruitmentService.sendAllOnboardingReminders(body.daysBeforeDeadline || 1);
  }

  @Patch('onboarding/task/status')
  async updateTaskStatus(@Body() dto: UpdateTaskStatusDto) {
    return this.recruitmentService.updateTaskStatus(dto);
  }

  @Post('onboarding/cancel')
  async cancelOnboarding(@Body() dto: CancelOnboardingDto) {
    return this.recruitmentService.cancelOnboarding(dto);
  }
  // ... Other endpoints related to recruitment

  //REC-003
  @ApiOperation({ summary: 'Create a new job template', description: 'Creates a reusable job template with title, department, qualifications and skills' })
  @ApiBody({ type: CreateJobTemplateDto, description: 'Job template data including title, department, qualifications and required skills' })
  @ApiResponse({ status: 201, description: 'Job template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data - validation failed' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Post('createTemplate')
  async createJobTemplate(@Body() CreateJobTemplateDto: CreateJobTemplateDto): Promise<JobTemplateDocument> {
    return await this.recruitmentService.createjob_template(CreateJobTemplateDto)
  }
  //REC- 003
  @ApiOperation({ summary: 'Create a new job requisition' })
  @ApiBody({ type: CreateJobRequisitionDto })
  @ApiResponse({ status: 201, description: 'Job requisition created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Job template not found' })
  @Post('Requisition')
  async createJobRequisition(@Body() CreateJobRequisitionDto: CreateJobRequisitionDto): Promise<JobRequisitionDocument> {
    return await this.recruitmentService.createjob_requision(CreateJobRequisitionDto)
  }

  //HELPS IN Doing REC-0023
  @ApiOperation({ summary: 'Update job requisition by ID', description: 'Updates an existing job requisition with new data. Used for modifying posting dates, requirements, or status.' })
  @ApiParam({ name: 'requisitionid', description: 'Unique job requisition identifier', example: 'REQ-2024-001', type: 'string' })
  @ApiBody({ type: UpdateJobRequisitionDto, description: 'Updated job requisition data - only provided fields will be updated' })
  @ApiResponse({ status: 200, description: 'Job requisition updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or validation failed' })
  @ApiResponse({ status: 404, description: 'Job requisition with specified ID not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Patch('Rrequisition/:requisitionid')
  async updateJobRequision(@Param('requisitionid') id: string, @Body() UpdateJobRequisitionDto: UpdateJobRequisitionDto): Promise<JobRequisitionDocument> {
    return await this.recruitmentService.updatejob_requisition(id, UpdateJobRequisitionDto)
  }
  //REC-0023
  @ApiOperation({ summary: 'Get all published job requisitions', description: 'Retrieves all job requisitions that are currently published and available for applications' })
  @ApiResponse({ status: 200, description: 'List of published job requisitions retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Get('Requisition/published')
  async getAllPublishedRequistions(): Promise<JobRequisitionDocument[]> {
    return await this.recruitmentService.getAllpublishedJobRequisition();
  }

  //REC-007
  @ApiOperation({ summary: 'Upload CV document', description: 'Uploads and stores a candidate CV document with metadata for recruitment purposes' })
  @ApiBody({ type: CreateCVDocumentDto, description: 'CV document data including file information and candidate reference' })
  @ApiResponse({ status: 201, description: 'CV document uploaded and stored successfully' })
  @ApiResponse({ status: 400, description: 'Invalid document data - validation failed or unsupported file type' })
  @ApiResponse({ status: 500, description: 'Internal server error or file storage failed' })
  @Post('CVdocument')
  async uploadDocument(@Body() documentDto: CreateCVDocumentDto): Promise<DocumentDocument> {
    return this.recruitmentService.createCVDocument(documentDto);
  }

  //REC-007
  @ApiOperation({ summary: 'Create a new job application', description: 'Submits a candidate application for a specific job requisition. Automatically sets initial status and stage.' })
  @ApiBody({ type: CreateApplicationDto, description: 'Application data linking candidate to job requisition with optional HR assignment' })
  @ApiResponse({ status: 201, description: 'Job application created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid application data - validation failed or duplicate application' })
  @ApiResponse({ status: 404, description: 'Referenced job requisition or candidate not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Post('Application')
  async createApplication(@Body() createApplicationDto: CreateApplicationDto): Promise<ApplicationDocument> {
    return this.recruitmentService.createApplication(createApplicationDto);
  }
  //REC-017 part 1 , REC-008
  @ApiOperation({ summary: 'Get all applications for a specific candidate' })
  @ApiParam({ name: 'candidateId', description: 'Candidate MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'List of candidate applications', type: [Object] })
  @ApiResponse({ status: 400, description: 'Invalid candidate ID format' })
  @Get('Application/:candidateId')
  async getApplicationsByCandidate(@Param('candidateId') candidateId: string): Promise<ApplicationDocument[]> {
    return this.recruitmentService.getallcandidateApplications(candidateId);
  }

  // REC-008 ,REC-022 ,REC-017 part 2: Update Application Status/Stage
  @ApiOperation({
    summary: 'Update application status and stage',
    description: 'Updates application status/stage and sends notifications. To schedule interviews when moving to hr_interview or department_interview stages, use the separate POST /Interview endpoint after updating the application stage.'
  })
  @ApiParam({ name: 'applicationId', description: 'Application MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateApplicationDto })
  @ApiResponse({ status: 200, description: 'Application updated successfully and history recorded. Notifications sent to candidate and HR.' })
  @ApiResponse({ status: 404, description: 'Application or job requisition not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Patch('Application/:applicationId/update/:hrId')
  async updateApplication(
    @Param('applicationId') applicationId: string,
    @Param('hrId') hrId: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ): Promise<ApplicationDocument> {
    return this.recruitmentService.updateApplication(applicationId, updateApplicationDto, hrId);
  }

  @ApiOperation({ summary: 'Send manual notification for application change' })
  @ApiParam({ name: 'applicationId', description: 'Application MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: SendNotificationDto, required: false })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 500, description: 'Failed to send notification' })
  @Post('Application/:applicationId/notify')
  async sendApplicationNotification(
    @Param('applicationId') applicationId: string,
    @Body() notificationData?: SendNotificationDto
  ): Promise<{ message: string }> {
    await this.recruitmentService.notifyApplicationChange(
      applicationId,
      notificationData?.candidateId,
      notificationData?.hrId,
      notificationData?.customMessage
    );
    return { message: 'Notification sent successfully' };
  }

  // =================== INTERVIEW ENDPOINTS ===================
  //REC -010
  @ApiOperation({
    summary: 'Create interview for application (Manual HR Process)',
    description: 'HR manually creates and schedules interviews for applications in hr_interview or department_interview stages. This allows HR to carefully select interviewers and schedule at appropriate times. Automatically sends notifications to candidate, HR, and selected panel members.'
  })
  @ApiBody({ type: CreateInterviewDto })
  @ApiResponse({ status: 201, description: 'Interview created successfully and notifications sent to candidate, HR, and panel members' })
  @ApiResponse({ status: 404, description: 'Application not found or invalid stage' })
  @ApiResponse({ status: 400, description: 'Invalid interview data' })
  @Post('Interview')
  async createInterview(@Body() createInterviewDto: CreateInterviewDto): Promise<InterviewDocument> {
    return this.recruitmentService.createInterview(createInterviewDto);
  }
  //REC-008
  @ApiOperation({ summary: 'Get interviews for application', description: 'Retrieves all interviews scheduled for a specific application including past and upcoming interviews' })
  @ApiParam({ name: 'applicationId', description: 'Application MongoDB ObjectId - must be a valid ObjectId format', example: '507f1f77bcf86cd799439011', type: 'string' })
  @ApiResponse({ status: 200, description: 'List of interviews for the application retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid application ID format - must be valid MongoDB ObjectId' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Get('Interview/Application/:applicationId')
  async getInterviewsByApplication(@Param('applicationId') applicationId: string): Promise<InterviewDocument[]> {
    return this.recruitmentService.getInterviewByApplication(applicationId);
  }

  /*@ApiOperation({ summary: 'Get interviews for application by stage' })
  @ApiParam({ name: 'applicationId', description: 'Application MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'stage', description: 'Interview stage', enum: ApplicationStage })
  @ApiResponse({ status: 200, description: 'List of interviews for the application and stage', type: [Object] })
  @Get('Interview/Application/:applicationId/Stage/:stage')
  async getInterviewsByApplicationAndStage(
    @Param('applicationId') applicationId: string,
    @Param('stage') stage: ApplicationStage
  ): Promise<InterviewDocument[]> {
    return this.recruitmentService.getInterviewByApplication(applicationId, stage);
  }*/
  //REC-011 & RE-020 & REC-021 & REC-008
  @ApiOperation({ summary: 'Update interview details and status', description: 'Updates interview details, status, feedback, and other fields. Sends notifications as needed.' })
  @ApiBody({ type: UpdateInterviewDto })
  @ApiResponse({ status: 200, description: 'Interview updated successfully and notifications sent' })
  @ApiResponse({ status: 400, description: 'Invalid interview ID or update data' })
  @ApiResponse({ status: 404, description: 'Interview not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Patch('Interview/:interviewId')
  async updateInterviewStatus(@Param('interviewId') interviewId: string, @Body() updateInterviewDto: UpdateInterviewDto): Promise<InterviewDocument> {
    return this.recruitmentService.updateInterview(interviewId, updateInterviewDto);
  }

  //REC-030
  @ApiOperation({ summary: 'adds refferals', description: '' })
  @ApiBody({ type: CreateReferralDto })
  @ApiResponse({ status: 200, description: 'RRefferal created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid 1' })
  @ApiResponse({ status: 404, description: 'Interview 2' })
  @ApiResponse({ status: 500, description: 'Internal 3' })
  @Post('Application/referral/:candidateId')
  async createReferral(@Param('candidateId') candidateId: string, @Body() createReferralDto: CreateReferralDto): Promise<ReferralDocument> {
    return this.recruitmentService.createReferral(candidateId, createReferralDto);
  }
}
