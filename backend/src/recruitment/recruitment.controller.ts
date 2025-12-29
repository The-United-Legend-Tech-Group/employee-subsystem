import { Controller, Post, Get, Patch, Body, UseInterceptors, UploadedFiles, UploadedFile, Param, Query, UseGuards, Req, BadRequestException, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { RecruitmentService } from './recruitment.service';
import { AuthGuard } from '../common/guards/authentication.guard';
import { authorizationGuard } from '../common/guards/authorization.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';
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
import { CreateAssessmentDto } from './dtos/create-assessment.dto';
import { ReferralDocument } from './models/referral.schema';
import { AssessmentResultDocument } from './models/assessment-result.schema';


@ApiTags('Recruitment')
@Controller('recruitment')
@UseGuards(AuthGuard, authorizationGuard)
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) { }

  @Post('offer/create')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.SYSTEM_ADMIN)
  async createOffer(@Body() dto: CreateOfferDto, @Req() req: any) {
    return this.recruitmentService.createOffer(dto, req.user?.sub);
  }

  @Get('offers/all')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.SYSTEM_ADMIN)
  async getAllOffers() {
    return this.recruitmentService.getAllOffers();
  }

  @Get('offers/my')
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.SYSTEM_ADMIN)
  async getMyOffers(@Req() req: any) {
    // Resolve candidate id from common token fields to support different auth payloads
    const candidateId = req.user?.candidateId || req.user?.sub || req.user?.employeeId;
    if (!candidateId) {
      throw new BadRequestException('Unable to determine candidate id from token');
    }

    return this.recruitmentService.getOffersByCandidateId(candidateId);
  }

  @Get('offers/candidate/:candidateId')
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async getOffersByCandidateId(@Param('candidateId') candidateId: string) {
    return this.recruitmentService.getOffersByCandidateId(candidateId);
  }

  @Get('offer/:offerId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.SYSTEM_ADMIN, SystemRole.JOB_CANDIDATE)
  async getOfferById(@Param('offerId') offerId: string) {
    return this.recruitmentService.getOfferById(offerId);
  }

  @Post('offer/add-approver')
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async addOfferApprover(@Body() dto: AddOfferApproverDto) {
    return this.recruitmentService.addOfferApprover(dto);
  }

  @Post('offer/approve')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
  async approveOffer(@Body() dto: ApproveOfferDto, @Req() req: any) {
    return this.recruitmentService.approveOffer(dto, req.user.sub);
  }

  @Post('offer/send')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.SYSTEM_ADMIN)
  async sendOffer(@Body() dto: SendOfferDto) {
    return this.recruitmentService.sendOffer(dto);
  }

  @Post('offer/candidate-respond')
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.SYSTEM_ADMIN)
  async candidateRespondOffer(@Body() dto: CandidateRespondOfferDto, @Req() req: any) {
    return this.recruitmentService.candidateRespondOffer(dto, req.user.sub);
  }

  @Get('offer/approvals/my')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
  async getMyApprovals(@Req() req: any) {
    const userId = req.user?.employeeId || req.user?.sub;
    return this.recruitmentService.getMyApprovals(userId);
  }

  @Get('contracts')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async getAllContracts() {
    return this.recruitmentService.getAllContracts();
  }

  @Get('contracts/candidate/:candidateId')
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async getContractsByCandidateId(@Param('candidateId') candidateId: string) {
    return this.recruitmentService.getContractsByCandidateId(candidateId);
  }

  @Get('contracts/my')
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.SYSTEM_ADMIN)
  async getMyContracts(@Req() req: any) {
    return this.recruitmentService.getContractsByCandidateId(req.user.sub);
  }

  @Post('contract/sign')
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  @UseInterceptors(FilesInterceptor('files'))
  async signContract(
    @Body() dto: UploadSignedContractDto,
    @UploadedFiles() files: any[],
    @Req() req: any
  ) {
    return this.recruitmentService.signContract(dto, files, req.user.sub);
  }

  @Post('contract/hr-sign')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async hrSignContract(@Body() dto: HrSignContractDto, @Req() req: any) {
    return this.recruitmentService.hrSignContract(dto, req.user.sub);
  }

  @Post('documents/upload')
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
  @UseInterceptors(FilesInterceptor('files'))
  async uploadComplianceDocuments(
    @Body() dto: UploadComplianceDocumentsDto,
    @UploadedFiles() files: any[],
    @Req() req: any
  ) {
    return this.recruitmentService.uploadComplianceDocuments(dto, files, req.user.sub);
  }

  @Get('documents')
  async getMyComplianceDocuments(@Req() req: any, @Query('employeeId') employeeId?: string) {
    return this.recruitmentService.getEmployeeDocuments(employeeId || req.user.sub);
  }
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
  @Get('documents/:documentId/view')
  async viewDocument(@Param('documentId') documentId: string, @Res({ passthrough: true }) res: Response, @Req() req: any): Promise<StreamableFile> {
    const { file, filename, mimeType } = await this.recruitmentService.getDocumentFile(documentId, req.user);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${filename}"`,
    });
    return file;
  }

  @Post('onboarding/checklist')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async createOnboardingChecklist(@Body() dto: CreateOnboardingChecklistDto) {
    return this.recruitmentService.createOnboardingChecklist(dto);
  }

  @Post('onboarding/checklist/defaults')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async createOnboardingWithDefaults(@Body() dto: CreateOnboardingWithDefaultsDto) {
    return this.recruitmentService.createOnboardingWithDefaults(dto);
  }

  @Get('onboarding/checklists/all')
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
  async getAllOnboardingChecklists() {
    return this.recruitmentService.getAllOnboardingChecklists();
  }

  @Get('onboarding/checklist')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
  async getOnboardingChecklist(@Query() dto: GetOnboardingChecklistDto) {
    return this.recruitmentService.getOnboardingChecklist(dto);
  }

  @Post('onboarding/reminders')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
  async sendOnboardingReminders(@Body() dto: SendOnboardingReminderDto) {
    return this.recruitmentService.sendOnboardingReminders(dto);
  }

  @Post('onboarding/reminders/all')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async sendAllOnboardingReminders(@Body() body: { daysBeforeDeadline?: number }) {
    return this.recruitmentService.sendAllOnboardingReminders(body.daysBeforeDeadline || 1);
  }

  @Patch('onboarding/task/status')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
  async updateTaskStatus(@Body() dto: UpdateTaskStatusDto, @Req() req: any) {
    return this.recruitmentService.updateTaskStatus(dto, req.user.sub);
  }

  @Post('onboarding/cancel')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
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
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.SYSTEM_ADMIN)
  async createJobTemplate(@Body() CreateJobTemplateDto: CreateJobTemplateDto): Promise<JobTemplateDocument> {
    return await this.recruitmentService.createjob_template(CreateJobTemplateDto)
  }

  @ApiOperation({ summary: 'Get all job templates', description: 'Retrieves all job templates in the system' })
  @ApiResponse({ status: 200, description: 'List of job templates retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Get('templates')
  async getAllJobTemplates(): Promise<JobTemplateDocument[]> {
    return await this.recruitmentService.getAllJobTemplates();
  }

  //REC- 003
  @ApiOperation({ summary: 'Create a new job requisition' })
  @ApiBody({ type: CreateJobRequisitionDto })
  @ApiResponse({ status: 201, description: 'Job requisition created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Job template not found' })
  @Post('Requisition')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.DEPARTMENT_HEAD, SystemRole.SYSTEM_ADMIN)
  async createJobRequisition(@Body() CreateJobRequisitionDto: CreateJobRequisitionDto, @Req() req: any): Promise<JobRequisitionDocument> {
    return await this.recruitmentService.createjob_requision(CreateJobRequisitionDto, req.user?.sub)
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
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.SYSTEM_ADMIN, SystemRole.HR_EMPLOYEE)
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

  @ApiOperation({ summary: 'Get all job requisitions', description: 'Retrieves all job requisitions regardless of status (for HR Manager)' })
  @ApiResponse({ status: 200, description: 'List of all job requisitions retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Get('Requisitions/all')
  async getAllRequisitions(): Promise<JobRequisitionDocument[]> {
    return await this.recruitmentService.getAllJobRequisitions();
  }

  //REC-007
  @ApiOperation({ summary: 'Upload CV document', description: 'Uploads and stores a candidate CV document with metadata for recruitment purposes' })
  @ApiBody({ type: CreateCVDocumentDto, description: 'CV document data including file information and candidate reference' })
  @ApiResponse({ status: 201, description: 'CV document uploaded and stored successfully' })
  @ApiResponse({ status: 400, description: 'Invalid document data - validation failed or unsupported file type' })
  @ApiResponse({ status: 500, description: 'Internal server error or file storage failed' })
  @Post('CVdocument')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@Body() documentDto: CreateCVDocumentDto, @UploadedFile() file: any): Promise<DocumentDocument> {
    if (!file && !documentDto.filePath) {
      throw new BadRequestException('File is required or filePath must be provided');
    }
    return this.recruitmentService.createCVDocument(documentDto, file);
  }

  //REC-007
  @ApiOperation({ summary: 'Create a new job application', description: 'Submits a candidate application for a specific job requisition. Automatically sets initial status and stage.' })
  @ApiBody({ type: CreateApplicationDto, description: 'Application data linking candidate to job requisition with optional HR assignment' })
  @ApiResponse({ status: 201, description: 'Job application created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid application data - validation failed or duplicate application' })
  @ApiResponse({ status: 404, description: 'Referenced job requisition or candidate not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Post('Application')
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.SYSTEM_ADMIN)
  @UseGuards(AuthGuard)
  async createApplication(@Body() createApplicationDto: CreateApplicationDto, @Req() req: any): Promise<ApplicationDocument> {
    // If user is authenticated, use their ID as candidateId if available
    const candidateId = req.user?.sub;
    return this.recruitmentService.createApplication(createApplicationDto, candidateId);
  }
  @Get('Application/my')
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.SYSTEM_ADMIN)
  async getMyApplications(@Req() req: any): Promise<ApplicationDocument[]> {
    return this.recruitmentService.getallcandidateApplications(req.user.sub);
  }

  //REC-017 part 1 , REC-008
  @ApiOperation({ summary: 'Get all applications for a specific candidate' })
  @ApiParam({ name: 'candidateId', description: 'Candidate MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'List of candidate applications', type: [Object] })
  @ApiResponse({ status: 400, description: 'Invalid candidate ID format' })
  @Get('Application/:candidateId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.JOB_CANDIDATE, SystemRole.SYSTEM_ADMIN)
  async getApplicationsByCandidate(@Param('candidateId') candidateId: string): Promise<ApplicationDocument[]> {
    return this.recruitmentService.getallcandidateApplications(candidateId);
  }

  @ApiOperation({ summary: 'Get all applications across all requisitions' })
  @ApiResponse({ status: 200, description: 'List of all applications with candidate data', type: [Object] })
  @Get('Applications/all')
  async getAllApplications(): Promise<ApplicationDocument[]> {
    return this.recruitmentService.getAllApplications();
  }

  @ApiOperation({ summary: 'Get all applications for a specific job requisition' })
  @ApiParam({ name: 'requisitionId', description: 'Job Requisition MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'List of applications for the requisition', type: [Object] })
  @Get('Applications/requisition/:requisitionId')
  async getApplicationsByRequisition(@Param('requisitionId') requisitionId: string): Promise<ApplicationDocument[]> {
    return this.recruitmentService.getApplicationsByRequisition(requisitionId);
  }

  @ApiOperation({ summary: 'Get application history and time-to-hire' })
  @ApiParam({ name: 'applicationId', description: 'Application MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Application history with time-to-hire metric' })
  @Get('Application/:applicationId/history')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.HR_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
  async getApplicationHistory(@Param('applicationId') applicationId: string) {
    return this.recruitmentService.getApplicationHistory(applicationId);
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
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.HR_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
  async updateApplication(
    @Param('applicationId') applicationId: string,
    @Param('hrId') hrId: string, // Kept for backward compatibility if needed, but prefer token
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Req() req: any
  ): Promise<ApplicationDocument> {
    const actualHrId = req.user?.sub || hrId;
    return this.recruitmentService.updateApplication(applicationId, updateApplicationDto, actualHrId);
  }

  @Patch('Application/:applicationId/update') // New clean endpoint
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.HR_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
  async updateApplicationMe(
    @Param('applicationId') applicationId: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Req() req: any
  ): Promise<ApplicationDocument> {
    return this.recruitmentService.updateApplication(applicationId, updateApplicationDto, req.user.sub);
  }

  @ApiOperation({ summary: 'Send manual notification for application change' })
  @ApiParam({ name: 'applicationId', description: 'Application MongoDB ObjectId', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: SendNotificationDto, required: false })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 500, description: 'Failed to send notification' })
  @Post('Application/:applicationId/notify')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.SYSTEM_ADMIN)
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
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.SYSTEM_ADMIN, SystemRole.HR_EMPLOYEE)
  async createInterview(@Body() createInterviewDto: CreateInterviewDto, @Req() req: any): Promise<InterviewDocument> {
    // If hrId not supplied, try to derive it from authenticated user
    if (!createInterviewDto.hrId) {
      const derivedHrId = req?.user?.employeeId || req?.user?._id || req?.user?.id || req?.user?.userId || req?.user?.sub;
      if (!derivedHrId) {
        throw new BadRequestException('HR ID missing and could not be derived from authenticated user');
      }
      createInterviewDto.hrId = derivedHrId;
    }

    // Convert scheduledDate string to Date object for service validations
    if (createInterviewDto.scheduledDate && typeof createInterviewDto.scheduledDate === 'string') {
      const parsed = new Date(createInterviewDto.scheduledDate);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestException('Invalid scheduledDate format; expected ISO date-time string');
      }
      // assign as any to satisfy service expecting Date in some places
      (createInterviewDto as any).scheduledDate = parsed;
    }

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
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
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
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.RECRUITER, SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
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
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async createReferral(@Param('candidateId') candidateId: string, @Body() createReferralDto: CreateReferralDto, @Req() req: any): Promise<ReferralDocument> {
    return this.recruitmentService.createReferral(candidateId, createReferralDto, req.user?.sub);
  }

  @ApiOperation({ summary: 'Get all referrals', description: 'Fetch all referral records' })
  @ApiResponse({ status: 200, description: 'Referrals retrieved successfully' })
  @Get('referrals/all')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async getAllReferrals(): Promise<ReferralDocument[]> {
    return this.recruitmentService.getAllReferrals();
  }

  // =================== ASSESSMENT ENDPOINTS ===================

  @ApiOperation({
    summary: 'Get my pending assessments',
    description: 'Get all assessments assigned to the authenticated user (interviewer)'
  })
  @ApiResponse({ status: 200, description: 'List of assessments for the interviewer' })
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  @Get('Assessment/MyAssessments')
  async getMyAssessments(@Req() req: any): Promise<AssessmentResultDocument[]> {
    // AuthGuard populates req.user from the Authorization header JWT (payload.sub)
    console.log('Fetching assessments for interviewer ID:', req.user?.sub);
    return this.recruitmentService.getMyAssessments(req.user?.sub);
  }

  @ApiOperation({
    summary: 'Get all assessments (HR only)',
    description: 'Get all assessment results across all interviews. Accessible only by HR roles.'
  })
  @ApiResponse({ status: 200, description: 'List of all assessments' })
  @Get('Assessment/All')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getAllAssessments(): Promise<AssessmentResultDocument[]> {
    return this.recruitmentService.getAllAssessments();
  }

  @ApiOperation({
    summary: 'Submit assessment for interview',
    description: 'Submit score and comments for an assigned assessment. Can only be done once. Validates interviewer is the assigned one.'
  })
  @ApiParam({
    name: 'assessmentId',
    description: 'Assessment MongoDB ObjectId',
    example: '507f1f77bcf86cd799439020',
    type: 'string'
  })
  @ApiBody({
    type: CreateAssessmentDto,
    description: 'Assessment data with score (1-10) and comments',
    examples: {
      'Excellent Assessment': {
        value: {
          score: 9.5,
          comments: 'Exceptional technical skills, excellent communication, strong problem-solving abilities. Highly recommend for hire.'
        }
      },
      'Good Assessment': {
        value: {
          score: 7.5,
          comments: 'Good technical knowledge, needs improvement in system design concepts.'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment submitted successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439020',
        interviewId: '507f1f77bcf86cd799439011',
        interviewerId: '507f1f77bcf86cd799439012',
        score: 9.5,
        comments: 'Exceptional technical skills, excellent communication.',
        createdAt: '2025-12-01T10:30:00.000Z',
        updatedAt: '2025-12-01T11:15:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Assessment already submitted or unauthorized',
    schema: {
      example: {
        statusCode: 400,
        message: 'Assessment has already been submitted and cannot be modified',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  @Patch('Assessment/:assessmentId')
  async submitAssessment(
    @Param('assessmentId') assessmentId: string,
    @Body() createAssessmentDto: CreateAssessmentDto,
    @Req() req: any
  ): Promise<AssessmentResultDocument> {
    return this.recruitmentService.submitAssessment(assessmentId, createAssessmentDto, req.user.sub);
  }
}
