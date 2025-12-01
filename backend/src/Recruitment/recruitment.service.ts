import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { DocumentDocument } from './models/document.schema';

import { Notification } from '../employee-subsystem/notification/models/notification.schema';
import { DocumentType } from './enums/document-type.enum';
import { OnboardingTaskStatus } from './enums/onboarding-task-status.enum';
import mongoose from 'mongoose';
import { UploadSignedContractDto } from './DTO/upload-signed-contract.dto';
import { UploadComplianceDocumentsDto } from './DTO/upload-compliance-documents.dto';
import { HrSignContractDto } from './DTO/hr-sign-contract.dto';
import { CreateOnboardingChecklistDto } from './DTO/create-onboarding-checklist.dto';
import { CreateOnboardingWithDefaultsDto } from './DTO/create-onboarding-with-defaults.dto';
import { CancelOnboardingDto } from './DTO/cancel-onboarding.dto';
import { GetOnboardingChecklistDto } from './DTO/get-onboarding-checklist.dto';
import { SendOnboardingReminderDto } from './DTO/send-onboarding-reminder.dto';
import { UpdateTaskStatusDto } from './DTO/update-task-status.dto';
import { CreateOfferDto } from './DTO/create-offer.dto';
import { AddOfferApproverDto } from './DTO/add-offer-approver.dto';
import { ApproveOfferDto } from './DTO/approve-offer.dto';
import { SendOfferDto } from './DTO/send-offer.dto';
import { CandidateRespondOfferDto } from './DTO/candidate-respond-offer.dto';
import { EmployeeService } from '../employee-subsystem/employee/employee.service';
//import { PayrollExecutionService } from '../payroll-execution/payroll-execution.service';

import { signingBonus, signingBonusDocument } from '../payroll/config_setup/models/signingBonus.schema';
import { payGrade, payGradeDocument } from '../payroll/config_setup/models/payGrades.schema';
import { OfferResponseStatus } from './enums/offer-response-status.enum';
import { OfferFinalStatus } from './enums/offer-final-status.enum';

//
import { Types } from 'mongoose';
import { JobTemplateDocument } from './models/job-template.schema';
import { JobRequisitionDocument } from './models/job-requisition.schema';
import { ApplicationDocument } from './models/application.schema';

import { InterviewDocument } from './models/interview.schema';
import { EmployeeProfileDocument } from '../employee-subsystem/employee/models/employee-profile.schema';
import { ReferralDocument } from './models/referral.schema';

import { NotificationService } from '../employee-subsystem/notification/notification.service';
import { ApplicationStage } from './enums/application-stage.enum';
import { ApplicationStatus } from './enums/application-status.enum';
import { InterviewStatus } from './enums/interview-status.enum';
import { InterviewMethod } from './enums/interview-method.enum';
import { SystemRole, EmployeeStatus, CandidateStatus } from '../employee-subsystem/employee/enums/employee-profile.enums';
import type { UpdateCandidateStatusDto } from '../employee-subsystem/employee/dto/update-candidate-status.dto';

import { CreateJobTemplateDto } from './dtos/create-job-template.dto';
import { CreateJobRequisitionDto } from './dtos/create-job-requisition.dto';
import { UpdateJobRequisitionDto } from './dtos/update-jobrequisition.dto';
import { CreateCVDocumentDto } from './dtos/create-cv-document.dto';
import { CreateApplicationDto } from './dtos/create-application.dto';
import { UpdateApplicationDto } from './dtos/update-application.dto';
import { CreateInterviewDto } from './dtos/create-interview.dto';
import { CreateNotificationDto } from '../employee-subsystem/notification/dto/create-notification.dto';
import { UpdateInterviewDto } from './dtos/Update-interview.dto';
import { CreateReferralDto } from './dtos/create-referral.dto';


import { EmployeeProfileRepository } from '../employee-subsystem/employee/repository/employee-profile.repository';
import { CandidateRepository } from '../employee-subsystem/employee/repository/candidate.repository';
import { EmployeeSystemRoleRepository } from '../employee-subsystem/employee/repository/employee-system-role.repository';

// Repository implementations
import {
  JobTemplateRepository,
  JobRequisitionRepository,
  ApplicationRepository,
  InterviewRepository,
  DocumentRepository,
  ReferralRepository,
  ApplicationHistoryRepository,
  OfferRepository,
  ContractRepository,
  OnboardingRepository
} from './repositories';

@Injectable()
export class RecruitmentService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: mongoose.Model<Notification>,
    @InjectModel(signingBonus.name) private signingBonusModel: mongoose.Model<signingBonusDocument>,
    @InjectModel(payGrade.name) private payGradeModel: mongoose.Model<payGradeDocument>,
    private readonly employeeService: EmployeeService,
    // Repository dependencies
    private readonly jobTemplateRepository: JobTemplateRepository,
    private readonly jobRequisitionRepository: JobRequisitionRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly applicationHistoryRepository: ApplicationHistoryRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly documentRepository: DocumentRepository,
    private readonly referralRepository: ReferralRepository,
    private readonly offerRepository: OfferRepository,
    private readonly contractRepository: ContractRepository,
    private readonly onboardingRepository: OnboardingRepository,

    private readonly notificationService: NotificationService,
    private readonly employeeProfileRepository: EmployeeProfileRepository,
    private readonly candidateRepository: CandidateRepository,
    private readonly employeeSystemRoleRepository: EmployeeSystemRoleRepository,
    //private payrollExecutionService: PayrollExecutionService,
  ) { }

  // need guards for auth and roles
  //REC-018
  async createOffer(dto: CreateOfferDto) {
    const { applicationId, candidateId, hrEmployeeId, role, benefits, conditions, insurances, content, deadline } = dto;

    // Lookup signing bonus by role/position from payroll configuration
    const bonusConfig = await this.signingBonusModel.findOne({
      positionName: role,
      status: 'approved'
    });

    // Lookup gross salary by role/position from payroll configuration
    const salaryConfig = await this.payGradeModel.findOne({
      grade: role,
      status: 'approved'
    });

    const signingBonusAmount = bonusConfig ? bonusConfig.amount : 0;
    const grossSalaryAmount = salaryConfig ? salaryConfig.grossSalary : 0;

    // Create the offer
    const offerData = {
      applicationId: new mongoose.Types.ObjectId(applicationId),
      candidateId: new mongoose.Types.ObjectId(candidateId),
      hrEmployeeId: new mongoose.Types.ObjectId(hrEmployeeId),
      grossSalary: grossSalaryAmount,
      signingBonus: signingBonusAmount,
      role,
      benefits: benefits as any,
      conditions,
      insurances,
      content,
      deadline: deadline ? new Date(deadline) : undefined,
      applicantResponse: OfferResponseStatus.PENDING,
      finalStatus: OfferFinalStatus.PENDING,
      approvers: [],
    };

    const offer = await this.offerRepository.create(offerData);

    return {
      success: true,
      message: 'Offer created successfully',
      offerId: offer._id,
      offer,
      signingBonusApplied: signingBonusAmount > 0,
      signingBonusAmount,
      grossSalarySource: bonusConfig ? 'payroll_config' : 'manual_input',
    };
  }

  // need guards for auth and roles
  //REC-014
  async addOfferApprover(dto: AddOfferApproverDto) {
    const { offerId, employeeId, role } = dto;

    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Check if approver already exists
    const existingApprover = offer.approvers.find(
      a => a.employeeId.toString() === employeeId
    );

    if (existingApprover) {
      throw new BadRequestException('This employee is already an approver for this offer');
    }

    // Add new approver with pending status
    offer.approvers.push({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      role,
      status: 'pending',
      actionDate: null,
      comment: null,
    });

    await this.offerRepository.updateById(offerId, { approvers: offer.approvers });

    return {
      success: true,
      message: 'Approver added successfully',
      offer,
    };
  }

  // need guards for auth and roles
  //REC-014
  async approveOffer(dto: ApproveOfferDto) {
    const { offerId, employeeId, status, comment } = dto;

    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Find the approver in the list
    const approver = offer.approvers.find(
      a => a.employeeId.toString() === employeeId
    );

    if (!approver) {
      throw new NotFoundException('You are not an approver for this offer');
    }

    if (approver.status !== 'pending') {
      throw new BadRequestException(`You have already ${approver.status} this offer`);
    }

    // Update approver status
    approver.status = status;
    approver.actionDate = new Date();
    approver.comment = comment || null;

    // Check if all approvers have approved
    const allApproved = offer.approvers.every(a => a.status === 'approved');
    const anyRejected = offer.approvers.some(a => a.status === 'rejected');

    if (anyRejected) {
      offer.finalStatus = OfferFinalStatus.REJECTED;
    }

    await this.offerRepository.updateById(offerId, {
      approvers: offer.approvers,
      finalStatus: offer.finalStatus
    });

    return {
      success: true,
      message: `Offer ${status} successfully`,
      offer,
      allApproved,
      finalStatus: offer.finalStatus,
    };
  }

  // need guards for auth and roles
  // REC-018
  async sendOffer(dto: SendOfferDto) {
    const { offerId } = dto;

    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Check if all required approvals are obtained
    if (offer.approvers.length > 0) {
      const allApproved = offer.approvers.every(a => a.status === 'approved');
      if (!allApproved) {
        throw new BadRequestException('Cannot send offer until all approvers have approved');
      }
    }

    // Mark offer as sent
    await this.offerRepository.updateById(offerId, { finalStatus: 'sent' });

    // Update candidate status to OFFER_SENT
    await this.employeeService.updateCandidateStatus(
      offer.candidateId.toString(),
      { status: CandidateStatus.OFFER_SENT } as UpdateCandidateStatusDto
    );

    // TODO: Send email/notification to candidate with offer letter
    const notification = new this.notificationModel({
      recipientId: [new mongoose.Types.ObjectId(offer.candidateId.toString())],
      type: 'Info',
      deliveryType: 'UNICAST',
      title: 'Job Offer Sent',
      message: `Your job offer for ${offer.role} has been sent. Please review and respond.`,
      relatedModule: 'Recruitment',
      isRead: false,
    });
    await notification.save();

    return {
      success: true,
      message: 'Offer sent to candidate successfully',
      offer,
    };
  }

  // need guards for auth and roles
  //REC-029
  async candidateRespondOffer(dto: CandidateRespondOfferDto) {
    const { offerId, candidateId, response, notes } = dto;

    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.candidateId.toString() !== candidateId) {
      throw new BadRequestException('This offer does not belong to you');
    }

    // Update candidate response
    offer.applicantResponse = response as any;

    if (response === 'accepted') {
      offer.finalStatus = OfferFinalStatus.APPROVED;
      offer.candidateSignedAt = new Date();

      // Update candidate status to OFFER_ACCEPTED
      await this.employeeService.updateCandidateStatus(
        candidateId,
        { status: CandidateStatus.OFFER_ACCEPTED } as UpdateCandidateStatusDto
      );

      // Automatically create contract when offer is accepted
      const contractData = {
        offerId: offer._id,
        acceptanceDate: new Date(),
        grossSalary: offer.grossSalary,
        signingBonus: offer.signingBonus,
        role: offer.role,
        benefits: offer.benefits,
      };
      await this.contractRepository.create(contractData);

      // Send notification
      const notification = new this.notificationModel({
        recipientId: [new mongoose.Types.ObjectId(offer.hrEmployeeId.toString())],
        type: 'Success',
        deliveryType: 'UNICAST',
        title: 'Offer Accepted',
        message: `Candidate has accepted the offer for ${offer.role}. Contract has been created. Please proceed with contract signing.`,
        relatedModule: 'Recruitment',
        isRead: false,
      });
      await notification.save();

    } else if (response === 'rejected') {
      offer.finalStatus = OfferFinalStatus.REJECTED;

      // Update candidate status to REJECTED
      await this.employeeService.updateCandidateStatus(
        candidateId,
        { status: CandidateStatus.REJECTED } as UpdateCandidateStatusDto
      );

      // Notify HR
      const notification = new this.notificationModel({
        recipientId: [new mongoose.Types.ObjectId(offer.hrEmployeeId.toString())],
        type: 'Warning',
        deliveryType: 'UNICAST',
        title: 'Offer Rejected',
        message: `Candidate has rejected the offer for ${offer.role}. ${notes || ''}`,
        relatedModule: 'Recruitment',
        isRead: false,
      });
      await notification.save();
    }

    await offer.save();

    return {
      success: true,
      message: `Offer ${response} successfully`,
      offer,
    };
  }

  // need guards for auth and roles
  async signContract(dto: UploadSignedContractDto, files: any[]) {
    const { contractId, candidateId, mainContractFileIndex, signedAt, documentTypes } = dto;

    const contract = await this.contractRepository.findById(contractId);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (!files || files.length === 0) {
      // nothing to attach — simply update signedAt if provided
      const updatedContract = await this.contractRepository.updateById(contractId, {
        employeeSignedAt: signedAt ? new Date(signedAt) : new Date()
      });
      return updatedContract;
    }

    // determine which file is the main signed contract
    let mainIndex = typeof mainContractFileIndex === 'number' ? mainContractFileIndex : -1;
    if (mainIndex === -1) {
      mainIndex = files.findIndex(f => {
        const name = ((f as any).originalname || (f as any).filename || (f as any).path || '').toString().toLowerCase();
        return name.includes('contract');
      });
    }
    if (mainIndex === -1) mainIndex = 0; // fallback to first file

    // create Document entries for each uploaded file
    const createdDocs: DocumentDocument[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      // use document type from frontend if provided, otherwise infer from mainContractFileIndex
      let docType: DocumentType;
      if (documentTypes && documentTypes[i]) {
        docType = documentTypes[i] as DocumentType;
      } else {
        docType = i === mainIndex ? DocumentType.CONTRACT : DocumentType.CERTIFICATE;
      }
      const docData = {
        ownerId: candidateId ? new mongoose.Types.ObjectId(candidateId) : undefined,
        type: docType,
        filePath: (f as any).path || (f as any).filename || f.originalname,
        uploadedAt: new Date(),
      };
      const doc = await this.documentRepository.create(docData);
      createdDocs.push(doc);
    }

    // choose main document for contract (the one with CONTRACT type)
    let mainDoc: DocumentDocument | undefined;
    mainDoc = createdDocs.find(d => d.type === DocumentType.CONTRACT) || createdDocs[0];

    if (mainDoc) {
      contract.documentId = mainDoc._id;
      contract.employeeSignatureUrl = mainDoc.filePath;
    }

    contract.employeeSignedAt = signedAt ? new Date(signedAt) : new Date();

    await contract.save();

    return contract;
  }

  // need guards for auth and roles
  //ONB-001
  async hrSignContract(dto: HrSignContractDto) {
    const { contractId, hrEmployeeId, signedAt } = dto;

    const contract = await this.contractRepository.findById(contractId);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (!contract.employeeSignedAt) {
      throw new BadRequestException('Employee must sign the contract first');
    }

    const updateData: any = {
      employerSignedAt: signedAt ? new Date(signedAt) : new Date()
    };

    // optionally store which HR employee signed
    if (hrEmployeeId) {
      updateData.employerSignatureUrl = `hr-signed-by-${hrEmployeeId}`;
    }

    await this.contractRepository.updateById(contractId, updateData);

    // Get candidateId from the offer for onboarding and bonus processing
    const populatedContract = await this.contractRepository.findById(contractId);
    const offer = populatedContract?.offerId as any;

    // Automatically trigger onboarding when BOTH employee and HR have signed
    if (offer?.candidateId) {
      const candidate = offer.candidateId;

      // Update candidate status to HIRED
      await this.employeeService.updateCandidateStatus(
        candidate._id ? candidate._id.toString() : candidate.toString(),
        { status: CandidateStatus.HIRED } as UpdateCandidateStatusDto
      );

      // Create employee profile first using candidate's actual data
      const employeeData = {
        firstName: candidate.firstName || 'New',
        lastName: candidate.lastName || 'Employee',
        nationalId: candidate.nationalId,
        employeeNumber: `EMP-${Date.now()}`,
        dateOfHire: new Date(),
        workEmail: candidate.personalEmail,
        status: 'PROBATION' as any,
        contractStartDate: new Date(),
        contractType: 'FULL_TIME_CONTRACT' as any,
        workType: 'FULL_TIME' as any,
      };

      // Validate that candidate has a national ID
      if (!employeeData.nationalId) {
        throw new BadRequestException('Candidate must have a national ID before creating employee profile');
      }

      const createdEmployee = await this.employeeService.onboard(employeeData);
      const employeeProfileId = String((createdEmployee as any)._id || (createdEmployee as any).id);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // Start date 7 days from now

      await this.createOnboardingWithDefaults({
        employeeId: employeeProfileId,
        contractId: contractId,
        startDate: startDate.toISOString(),
        includeITTasks: true,
        includeAdminTasks: true,
        includeHRTasks: true,
      });

      // Send notification to new employee with their employee details
      const welcomeNotification = new this.notificationModel({
        recipientId: [new mongoose.Types.ObjectId(employeeProfileId)],
        type: 'Success',
        deliveryType: 'UNICAST',
        title: 'Welcome to the Team!',
        message: `Congratulations! Your employee profile has been created. Your Employee ID: ${employeeData.employeeNumber}. Work Email: ${employeeData.workEmail || 'Will be assigned'}. Your start date is ${startDate.toDateString()}. Please check your onboarding checklist for tasks to complete.`,
        relatedModule: 'Recruitment',
        isRead: false,
      });
      await welcomeNotification.save();

      // Send notification to candidate (before they become employee) about acceptance
      const candidateNotification = new this.notificationModel({
        recipientId: [new mongoose.Types.ObjectId(offer.candidateId._id.toString())],
        type: 'Success',
        deliveryType: 'UNICAST',
        title: 'Contract Fully Signed - You Are Hired!',
        message: `Congratulations! Your employment contract has been fully signed by HR. You have been officially hired! Your Employee ID is: ${employeeData.employeeNumber}. Your work email will be: ${employeeData.workEmail || 'assigned soon'}. Your start date is ${startDate.toDateString()}. Welcome to the team!`,
        relatedModule: 'Recruitment',
        isRead: false,
      });
      await candidateNotification.save();
    }

    // Automatically process signing bonus when BOTH employee and HR have signed
    // if (contract.signingBonus && contract.signingBonus > 0 && contract.role) {
    //     if (offer?.candidateId) {
    //         await this.payrollExecutionService.processSigningBonusByPosition(
    //             offer.candidateId.toString(),
    //             contract.role
    //         );
    //     }
    // }

    return contract;
  }

  // need guards for auth and roles
  //ONB-007
  async uploadComplianceDocuments(dto: UploadComplianceDocumentsDto, files: any[]) {
    const { employeeId, documentTypes } = dto;

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (documentTypes.length !== files.length) {
      throw new BadRequestException('Number of document types must match number of files');
    }

    // create Document entries for each uploaded file
    const createdDocs: DocumentDocument[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const docType = documentTypes[i] as DocumentType;

      const docData = {
        ownerId: new mongoose.Types.ObjectId(employeeId),
        type: docType,
        filePath: (f as any).path || (f as any).filename || f.originalname,
        uploadedAt: new Date(),
      };
      const doc = await this.documentRepository.create(docData);
      createdDocs.push(doc);
    }

    // Automatically update onboarding tasks based on uploaded document types
    const onboarding = await this.onboardingRepository.findByEmployeeId(employeeId);

    const updatedTasks: string[] = [];
    if (onboarding) {
      for (let i = 0; i < documentTypes.length; i++) {
        const docType = documentTypes[i];
        const doc = createdDocs[i];

        // Map document types to task names (customize based on your task naming)
        const taskNameMap: Record<string, string[]> = {
          'id': ['Upload ID', 'Submit ID', 'Provide ID'],
          'contract': ['Upload Contract', 'Submit Contract', 'Sign Contract'],
          'certificate': ['Upload Certification', 'Submit Certifications', 'Provide Certificates'],
        };

        const possibleTaskNames = taskNameMap[docType.toLowerCase()] || [];

        // Find and update matching task
        for (const task of onboarding.tasks) {
          const taskNameLower = task.name.toLowerCase();
          const isMatch = possibleTaskNames.some(name => taskNameLower.includes(name.toLowerCase()));

          if (isMatch && task.status !== OnboardingTaskStatus.COMPLETED) {
            task.status = OnboardingTaskStatus.COMPLETED;
            task.completedAt = new Date();
            task.documentId = doc._id;
            updatedTasks.push(task.name);
            break; // Only update first matching task
          }
        }
      }

      // Check if all tasks are completed
      const allCompleted = onboarding.tasks.every(t => t.status === OnboardingTaskStatus.COMPLETED);
      if (allCompleted) {
        onboarding.completed = true;
        onboarding.completedAt = new Date();
      }

      await onboarding.save();
    }

    return {
      success: true,
      message: 'Compliance documents uploaded successfully',
      documentIds: createdDocs.map(d => d._id),
      documents: createdDocs,
      updatedTasks: updatedTasks.length > 0 ? updatedTasks : undefined,
    };
  }

  // need guards for auth and roles
  //ONB-001
  async createOnboardingChecklist(dto: CreateOnboardingChecklistDto) {
    const { employeeId, tasks } = dto;

    // Transform tasks to include default status
    const formattedTasks = tasks.map(task => ({
      name: task.name,
      department: task.department,
      status: OnboardingTaskStatus.PENDING,
      deadline: task.deadline ? new Date(task.deadline) : undefined,
      notes: task.notes,
    }));

    // Check if onboarding already exists
    let onboarding = await this.onboardingRepository.findByEmployeeId(employeeId);

    if (onboarding) {
      // Add new tasks to existing onboarding
      onboarding.tasks.push(...formattedTasks);
      const updatedOnboarding = await this.onboardingRepository.updateById(
        onboarding._id.toString(),
        { tasks: onboarding.tasks }
      );

      return {
        success: true,
        message: 'Tasks added to existing onboarding checklist',
        onboardingId: onboarding._id,
        onboarding: updatedOnboarding,
        tasksAdded: formattedTasks.length,
      };
    }

    // Create new onboarding if none exists
    if (!dto.contractId) {
      throw new BadRequestException('contractId is required when creating a new onboarding');
    }

    const onboardingData = {
      employeeId: new mongoose.Types.ObjectId(employeeId),
      contractId: new mongoose.Types.ObjectId(dto.contractId),
      tasks: formattedTasks,
      completed: false,
    };

    onboarding = await this.onboardingRepository.create(onboardingData);

    return {
      success: true,
      message: 'Onboarding checklist created successfully',
      onboardingId: onboarding._id,
      onboarding,
    };
  }

  // need guards for auth and roles
  //ONB-001
  //ONB-009
  //ONB-012
  //ONB-013
  async createOnboardingWithDefaults(dto: CreateOnboardingWithDefaultsDto) {
    const { employeeId, contractId, startDate, includeITTasks = true, includeAdminTasks = true, includeHRTasks = true } = dto;

    const deadline = startDate ? new Date(startDate) : new Date();
    const tasks: any[] = [];

    // IT Tasks
    if (includeITTasks) {
      tasks.push(
        {
          name: 'Allocate Email Account',
          department: 'IT',
          status: OnboardingTaskStatus.PENDING,
          deadline: deadline,
          notes: 'Automated: Create corporate email account'
        },
        {
          name: 'Assign Laptop',
          department: 'IT',
          status: OnboardingTaskStatus.PENDING,
          deadline: deadline,
          notes: 'Automated: Allocate and configure laptop'
        },
        {
          name: 'Grant System Access',
          department: 'IT',
          status: OnboardingTaskStatus.PENDING,
          deadline: deadline,
          notes: 'Automated: Setup access to internal systems and applications'
        }
      );
    }

    // Admin Tasks
    if (includeAdminTasks) {
      tasks.push(
        {
          name: 'Assign Workspace',
          department: 'Admin',
          status: OnboardingTaskStatus.PENDING,
          deadline: deadline,
          notes: 'Automated: Allocate desk/office space'
        },
        {
          name: 'Issue ID Badge',
          department: 'Admin',
          status: OnboardingTaskStatus.PENDING,
          deadline: deadline,
          notes: 'Automated: Create and assign employee ID badge'
        }
      );
    }

    // HR Tasks
    if (includeHRTasks) {
      tasks.push(
        {
          name: 'Setup Payroll',
          department: 'HR',
          status: OnboardingTaskStatus.PENDING,
          deadline: deadline,
          notes: 'Automated: Initialize payroll account (REQ-PY-23)'
        },
        {
          name: 'Enroll in Benefits',
          department: 'HR',
          status: OnboardingTaskStatus.PENDING,
          deadline: deadline,
          notes: 'Automated: Setup health insurance and benefits'
        }
      );
    }

    // Check if onboarding already exists
    let onboarding = await this.onboardingRepository.findByEmployeeId(employeeId);

    if (onboarding) {
      // Add new tasks to existing onboarding
      onboarding.tasks.push(...tasks);
      // Update contractId if provided
      if (contractId) {
        onboarding.contractId = new mongoose.Types.ObjectId(contractId);
      }
      await onboarding.save();

      return {
        success: true,
        message: 'Default tasks added to existing onboarding checklist',
        onboardingId: onboarding._id,
        onboarding,
        taskSummary: {
          itTasks: includeITTasks ? 3 : 0,
          adminTasks: includeAdminTasks ? 2 : 0,
          hrTasks: includeHRTasks ? 2 : 0,
          tasksAdded: tasks.length,
          totalTasks: onboarding.tasks.length,
        },
      };
    }

    // Create new onboarding if none exists
    if (!contractId) {
      throw new BadRequestException('contractId is required when creating a new onboarding');
    }

    const onboardingData = {
      employeeId: new mongoose.Types.ObjectId(employeeId),
      contractId: new mongoose.Types.ObjectId(contractId),
      tasks,
      completed: false,
    };

    onboarding = await this.onboardingRepository.create(onboardingData);

    // Send notification to System Admin for IT and Admin tasks
    if (includeITTasks || includeAdminTasks) {
      const itAdminTaskCount = (includeITTasks ? 3 : 0) + (includeAdminTasks ? 2 : 0);
      const tasksList: string[] = [];
      if (includeITTasks) tasksList.push('IT setup tasks (Email, Laptop, System Access)');
      if (includeAdminTasks) tasksList.push('Admin tasks (Workspace, ID Badge)');

      const adminNotification = new this.notificationModel({
        recipientId: [],
        type: 'Info',
        deliveryType: 'BROADCAST',
        deliverToRole: 'System Admin',
        title: 'New Employee Onboarding Tasks Assigned',
        message: `New onboarding tasks have been created for employee ${employeeId}. Tasks: ${tasksList.join(', ')}. Deadline: ${deadline.toDateString()}. Total tasks: ${itAdminTaskCount}.`,
        relatedModule: 'Recruitment',
        isRead: false,
      });
      await adminNotification.save();
    }

    return {
      success: true,
      message: 'Onboarding checklist created with default tasks',
      onboardingId: onboarding._id,
      onboarding,
      taskSummary: {
        itTasks: includeITTasks ? 3 : 0,
        adminTasks: includeAdminTasks ? 2 : 0,
        hrTasks: includeHRTasks ? 2 : 0,
        totalTasks: tasks.length,
      },
    };
  }

  // need guards for auth and roles
  //ONB-004
  async getOnboardingChecklist(dto: GetOnboardingChecklistDto) {
    const { employeeId } = dto;

    const onboarding = await this.onboardingRepository.findByEmployeeId(employeeId);

    if (!onboarding) {
      throw new NotFoundException('No onboarding checklist found for this employee');
    }

    // Calculate progress statistics
    const totalTasks = onboarding.tasks.length;
    const completedTasks = onboarding.tasks.filter(t => t.status === OnboardingTaskStatus.COMPLETED).length;
    const inProgressTasks = onboarding.tasks.filter(t => t.status === OnboardingTaskStatus.IN_PROGRESS).length;
    const pendingTasks = onboarding.tasks.filter(t => t.status === OnboardingTaskStatus.PENDING).length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Find next task to complete (first pending or in-progress task)
    const nextTask = onboarding.tasks.find(
      t => t.status === OnboardingTaskStatus.IN_PROGRESS || t.status === OnboardingTaskStatus.PENDING
    );

    return {
      success: true,
      onboarding,
      progress: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        progressPercentage,
      },
      nextTask: nextTask || null,
    };
  }

  // need guards for auth and roles
  //ONB-005
  async sendOnboardingReminders(dto: SendOnboardingReminderDto) {
    const { employeeId, daysBeforeDeadline = 1 } = dto;

    const onboarding = await this.onboardingRepository.findByEmployeeId(employeeId);

    if (!onboarding) {
      throw new NotFoundException('No onboarding checklist found for this employee');
    }

    const now = new Date();
    const reminderThreshold = new Date();
    reminderThreshold.setDate(now.getDate() + daysBeforeDeadline);

    const notifications: Notification[] = [];

    // Find tasks that are not completed and have upcoming deadlines
    for (const task of onboarding.tasks) {
      if (task.status !== OnboardingTaskStatus.COMPLETED && task.deadline) {
        const taskDeadline = new Date(task.deadline);

        // Send reminder if deadline is within threshold and hasn't passed
        if (taskDeadline >= now && taskDeadline <= reminderThreshold) {
          const daysUntilDeadline = Math.ceil((taskDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          const notification = new this.notificationModel({
            recipientId: [new mongoose.Types.ObjectId(employeeId)],
            type: 'Warning',
            deliveryType: 'UNICAST',
            title: 'Onboarding Task Reminder',
            message: `Reminder: Onboarding task "${task.name}" is due in ${daysUntilDeadline} day(s). Department: ${task.department || 'N/A'}`,
            relatedModule: 'Recruitment',
            isRead: false,
          });
          await notification.save();
          notifications.push(notification);
        }
      }
    }

    return {
      success: true,
      message: `${notifications.length} reminder(s) sent`,
      notifications,
    };
  }

  // Call this method from a scheduled job/cron to check all employees
  //ONB-005
  async sendAllOnboardingReminders(daysBeforeDeadline: number = 1) {
    const onboardings = await this.onboardingRepository.findByStatus(false);

    const results: any[] = [];
    for (const onboarding of onboardings) {
      try {
        const result = await this.sendOnboardingReminders({
          employeeId: onboarding.employeeId.toString(),
          daysBeforeDeadline,
        });
        results.push(result);
      } catch (error) {
        console.error(`Failed to send reminders for employee ${onboarding.employeeId}:`, error);
      }
    }

    return {
      success: true,
      totalProcessed: onboardings.length,
      results,
    };
  }

  // need guards for auth and roles
  //hepls with checklist
  async updateTaskStatus(dto: UpdateTaskStatusDto) {
    const { employeeId, taskName, status, documentId } = dto;

    const onboarding = await this.onboardingRepository.findByEmployeeId(employeeId);

    if (!onboarding) {
      throw new NotFoundException('No onboarding checklist found for this employee');
    }

    const task = onboarding.tasks.find(t => t.name === taskName);
    if (!task) {
      throw new NotFoundException(`Task "${taskName}" not found in onboarding checklist`);
    }

    task.status = status as OnboardingTaskStatus;
    if (status === OnboardingTaskStatus.COMPLETED) {
      task.completedAt = new Date();
    }
    if (documentId) {
      task.documentId = new mongoose.Types.ObjectId(documentId);
    }

    // Check if all tasks are completed
    const allCompleted = onboarding.tasks.every(t => t.status === OnboardingTaskStatus.COMPLETED);
    if (allCompleted) {
      onboarding.completed = true;
      onboarding.completedAt = new Date();
    }

    await onboarding.save();

    return {
      success: true,
      message: `Task "${taskName}" updated to ${status}`,
      onboarding,
    };
  }

  // need guards for auth and roles
  async cancelOnboarding(dto: CancelOnboardingDto) {
    const { employeeId, reason, notes } = dto;

    const onboarding = await this.onboardingRepository.findByEmployeeId(employeeId);

    if (!onboarding) {
      throw new NotFoundException('No onboarding checklist found for this employee');
    }

    if (onboarding.completed) {
      throw new BadRequestException('Cannot cancel completed onboarding');
    }

    onboarding.tasks.forEach(task => {
      if (task.status !== OnboardingTaskStatus.COMPLETED) {
        task.status = OnboardingTaskStatus.PENDING; // Or create a CANCELLED status
        task.notes = `Cancelled: ${reason}. ${task.notes || ''}`;
      }
    });

    onboarding.completed = true;
    onboarding.completedAt = new Date();

    await onboarding.save();

    const notification = new this.notificationModel({
      recipientId: [new mongoose.Types.ObjectId(employeeId)],
      type: 'Alert',
      deliveryType: 'UNICAST',
      title: 'Onboarding Cancelled',
      message: `Onboarding cancelled due to: ${reason}. ${notes || ''}`,
      relatedModule: 'Recruitment',
      isRead: false,
    });
    await notification.save();

    return {
      success: true,
      message: 'Onboarding cancelled successfully',
      reason,
      onboarding,
    };
  }
  // ADDING AHMED'S STUFF HERE

  async validateEmployeeExistence(employeeId: string, roles: SystemRole[]): Promise<boolean> {
    try {
      const employee = await this.employeeProfileRepository.findById(employeeId);

      if (!employee) {
        return false;
      }

      const employeeObj = employee.toObject ? employee.toObject() : employee;

      // Check if employee has HR role and is active
      const isHR = await this.checkIfEmployeeIsAsExpected(employeeObj, roles);
      const isActive = this.checkIfEmployeeIsActive(employeeObj);

      return isHR && isActive;
    } catch (error) {
      // If getProfile throws NotFoundException, HR doesn't exist
      return false;
    }
  }

  // Helper method to check if employee has HR role
  private async checkIfEmployeeIsAsExpected(employee: EmployeeProfileDocument | any, roles: SystemRole[]): Promise<boolean> {
    try {
      const employeeId = employee._id || employee.id;

      // Find the employee's system roles
      const employeeSystemRole = await this.employeeSystemRoleRepository.findOne({
        employeeProfileId: new Types.ObjectId(employeeId),
        isActive: true
      });

      if (!employeeSystemRole) {
        return false;
      }

      // Check if employee has any HR-related role

      return employeeSystemRole.roles.some(role => roles.includes(role));
    } catch (error) {
      console.error('Error checking HR role:', error);
      return false;
    }
  }

  // Helper method to check if employee is active
  private checkIfEmployeeIsActive(employee: EmployeeProfileDocument | any): boolean {
    try {
      return employee.status === EmployeeStatus.ACTIVE;
    } catch (error) {
      console.error('Error checking employee status:', error);
      return false;
    }
  }

  private async validateCandidateExistence(candidateId: string): Promise<boolean> {
    try {
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        return false;
      }
      return true;
    }
    catch (error) {
      // If getProfile throws NotFoundException, candidate doesn't exist
      return false;
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  //REC-003: Create Job Template and Job Requisition
  async createjob_template(createjob_template: CreateJobTemplateDto): Promise<JobTemplateDocument> {
    return await this.jobTemplateRepository.create(createjob_template);
  }
  async createjob_requision(createjob_requision: CreateJobRequisitionDto): Promise<JobRequisitionDocument> {
    const templateExists = await this.jobTemplateRepository.findById(createjob_requision.templateId);
    if (!templateExists) {
      throw new NotFoundException(`Job template with id ${createjob_requision.templateId} not found`);
    }
    if (createjob_requision.openings <= 0) {
      throw new NotFoundException(`Number of openings must be greater than zero`);
    }
    if (!createjob_requision.hiringManagerId) {
      throw new NotFoundException(`Hiring Manager ID is required`);
    }
    const isHiringManagerValid = await this.validateEmployeeExistence(createjob_requision.hiringManagerId, [SystemRole.HR_MANAGER, SystemRole.HR_ADMIN]);
    if (!isHiringManagerValid) {
      throw new NotFoundException(`Hiring Manager with id ${createjob_requision.hiringManagerId} is not valid or not active`);
    }
    const jobRequisitionData = {
      ...createjob_requision,
      templateId: new Types.ObjectId(createjob_requision.templateId),
      hiringManagerId: new Types.ObjectId(createjob_requision.hiringManagerId),
      postingDate: createjob_requision.postingDate ? new Date(createjob_requision.postingDate) : undefined,
      expiryDate: createjob_requision.expiryDate ? new Date(createjob_requision.expiryDate) : undefined
    };
    return await this.jobRequisitionRepository.create(jobRequisitionData);
  }

  //HELPS IN Doing REC-023
  async updatejob_requisition(requisitionId: string, updatejob_requisition: UpdateJobRequisitionDto): Promise<JobRequisitionDocument> {
    const templateExists = await this.jobTemplateRepository.findById(updatejob_requisition.templateId);
    if (!templateExists) {
      throw new NotFoundException(`Job template with id ${updatejob_requisition.templateId} not found`);
    }
    if (updatejob_requisition.openings !== undefined && updatejob_requisition.openings <= 0) {
      throw new NotFoundException(`Number of openings must be greater than zero`);
    }
    //if () {} can check who will be updating 
    const requisition = await this.jobRequisitionRepository.updateById(
      requisitionId,
      updatejob_requisition
    );

    if (!requisition) {
      throw new NotFoundException(`Job requisition with requisitionId ${requisitionId} not found`);
    }

    return requisition;
  }
  // REC:-023
  async getAllpublishedJobRequisition(): Promise<JobRequisitionDocument[]> {
    // can add validation for who is requesting
    return this.jobRequisitionRepository.find({ publishStatus: 'published' });
  }
  // REC-007: Create CV Document
  async createCVDocument(createCVDocumentDto: CreateCVDocumentDto): Promise<DocumentDocument> {
    const isCandidateValid = await this.validateCandidateExistence(createCVDocumentDto.ownerId);
    if (!isCandidateValid) {
      throw new NotFoundException(`Candidate with id ${createCVDocumentDto.ownerId} is not valid or not active`);
    }
    if (createCVDocumentDto.type != 'cv') {
      throw new NotFoundException(`Document type must be 'cv'`);
    }

    const documentData = {
      ...createCVDocumentDto,
      ownerId: createCVDocumentDto.ownerId ? new Types.ObjectId(createCVDocumentDto.ownerId) : undefined,
      uploadedAt: createCVDocumentDto.uploadedAt || new Date()
    };
    return await this.documentRepository.create(documentData);
  }

  //REC-007: Create Application
  async createApplication(createApplicationDto: CreateApplicationDto): Promise<ApplicationDocument> {
    // Find the requisition by user-defined requisitionId
    const requisition = await this.jobRequisitionRepository.findOne({ requisitionId: createApplicationDto.requisitionId });
    if (!requisition) {
      throw new NotFoundException(`Job requisition with id ${createApplicationDto.requisitionId} not found`);
    }
    const isCandidateValid = await this.validateCandidateExistence(createApplicationDto.candidateId);
    if (!isCandidateValid) {
      throw new NotFoundException(`Candidate with id ${createApplicationDto.candidateId} is not valid or not active`);
    }
    // Check if application already exists for this candidate and requisition
    const existingApplication = await this.applicationRepository.findOne({
      candidateId: new Types.ObjectId(createApplicationDto.candidateId),
      requisitionId: requisition._id
    });

    if (existingApplication) {
      throw new Error(`Application already exists for candidate ${createApplicationDto.candidateId} and requisition ${createApplicationDto.requisitionId}`);
    }

    const applicationData = {
      candidateId: new Types.ObjectId(createApplicationDto.candidateId),
      requisitionId: requisition._id, // Use the MongoDB _id of the found requisition
      assignedHr: createApplicationDto.assignedHr ? new Types.ObjectId(createApplicationDto.assignedHr) : undefined
    };

    return await this.applicationRepository.create(applicationData);
  }
  //could be REC-017 ,related ,also need to add validation for it being hr or candidate
  async getApplicationById(applicationId: string): Promise<ApplicationDocument> {
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) {
      throw new NotFoundException(`Application with id ${applicationId} not found`);
    }
    return application;
  }
  //REC-017 part 1 also need to add validation for it being hr or candidate
  async getallcandidateApplications(candidateId: string): Promise<ApplicationDocument[]> {
    if (!await this.validateCandidateExistence(candidateId)) {
      throw new NotFoundException(`Candidate with id ${candidateId} is not valid or not active`);
    }
    return this.applicationRepository.findByCandidateId(candidateId);
  }

  // REC-017 part2 & REC-022: Update Application Status/Stage by candidateId and requisitionId
  async updateApplication(applicationId: string, updateApplicationDto: UpdateApplicationDto, hrId: string): Promise<ApplicationDocument> {
    //Validate HR exists and has proper role
    const isValidHR = await this.validateEmployeeExistence(hrId, [SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE]);
    if (!isValidHR) {
      throw new NotFoundException(`HR with id ${hrId} is not valid or not active`);
    }

    // Use the ID from DTO if provided, otherwise use the parameter
    const targetApplicationId = applicationId;

    // Find the application to update
    const currentApplication = await this.applicationRepository.findById(targetApplicationId);
    if (!currentApplication) {
      throw new NotFoundException(`Application with id ${targetApplicationId} not found`);
    }

    // Prepare update data (exclude id and hrId from the update)
    const { ...updateData } = updateApplicationDto;

    // Update the application directly by ID
    const updatedApplication = await this.applicationRepository.updateById(
      targetApplicationId,
      updateData
    );

    if (!updatedApplication) {
      throw new NotFoundException(`Failed to update application with id ${targetApplicationId}`);
    }

    // Create history record if there were changes
    if (updateApplicationDto.currentStage || updateApplicationDto.status) {
      const historyRecordData = {
        applicationId: currentApplication._id,
        oldStage: currentApplication.currentStage,
        newStage: updateApplicationDto.currentStage || currentApplication.currentStage,
        oldStatus: currentApplication.status,
        newStatus: updateApplicationDto.status || currentApplication.status,
        changedBy: new Types.ObjectId(hrId) // TODO: Replace with actual user ID from auth context
      };

      await this.applicationHistoryRepository.create(historyRecordData);
    }

    // Create interview if needed (when stage changes to interview and interview data provided)
    /*  if (updateApplicationDto.interviewData) {
        await this.autoCreateInterviewIfNeeded(
          updatedApplication,
          currentApplication,
          updateApplicationDto.interviewData
        );
      }*/

    // Get requisition details for notification
    const requisition = await this.jobRequisitionRepository.findById(updatedApplication.requisitionId.toString());
    const requisitionId = requisition?.requisitionId || 'Unknown';

    // Send notifications after successful update
    await this.sendApplicationStatusNotification(
      updatedApplication,
      currentApplication,
      requisitionId
    );

    return updatedApplication;
  }

  /**
   * Send notifications to candidate and HR when application status or stage changes
   
  REC-008
  REC-022*/
  async sendApplicationStatusNotification(
    updatedApplication: ApplicationDocument,
    previousApplication: ApplicationDocument,
    requisitionId: string
  ): Promise<void> {
    const recipients: string[] = [];

    // Add candidate to recipients
    recipients.push(updatedApplication.candidateId.toString());

    // Add assigned HR to recipients if exists
    if (updatedApplication.assignedHr) {
      recipients.push(updatedApplication.assignedHr.toString());
    }

    const statusChanged = updatedApplication.status !== previousApplication.status;
    const stageChanged = updatedApplication.currentStage !== previousApplication.currentStage;

    if (statusChanged || stageChanged) {
      const notificationData: CreateNotificationDto = {
        recipientId: recipients,
        type: this.getNotificationType(updatedApplication.status),
        deliveryType: 'MULTICAST',
        title: 'Application Status Update',
        message: this.buildNotificationMessage(
          updatedApplication,
          previousApplication,
          requisitionId,
          statusChanged,
          stageChanged
        ),
        relatedEntityId: updatedApplication._id.toString(),
        relatedModule: 'Recruitment',
        isRead: false,
      };

      try {
        await this.notificationService.create(notificationData);
      } catch (error) {
        console.error('Failed to send application status notification:', error);
        // Don't throw error to prevent breaking the main application update flow
      }
    }
  }

  /**
   * Get notification type based on application status
   */
  private getNotificationType(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.HIRED:
        return 'Success';
      case ApplicationStatus.OFFER:
        return 'Info';
      case ApplicationStatus.REJECTED:
        return 'Alert';
      case ApplicationStatus.IN_PROCESS:
      case ApplicationStatus.SUBMITTED:
        return 'Info';
      default:
        return 'Info';
    }
  }

  /**
   * Build notification message based on changes
   */
  private buildNotificationMessage(
    updatedApplication: ApplicationDocument,
    previousApplication: ApplicationDocument,
    requisitionId: string,
    statusChanged: boolean,
    stageChanged: boolean
  ): string {
    let message = `Your application for job requisition ${requisitionId} has been updated. `;

    if (statusChanged) {
      message += `Status changed from "${previousApplication.status}" to "${updatedApplication.status}". `;
    }

    if (stageChanged) {
      message += `Stage changed from "${previousApplication.currentStage}" to "${updatedApplication.currentStage}". `;
    }

    // Add specific messages based on status
    switch (updatedApplication.status) {
      case ApplicationStatus.HIRED:
        message += 'Congratulations! You have been selected for the position.';
        break;
      case ApplicationStatus.OFFER:
        message += 'An offer has been extended. Please check your email for details.';
        break;
      case ApplicationStatus.REJECTED:
        message += 'Unfortunately, your application was not successful this time.';
        break;
      case ApplicationStatus.IN_PROCESS:
        message += 'Your application is currently being reviewed.';
        break;
    }

    return message;
  }

  /**
   * Public method to manually send notifications for application changes
   * This can be called from controllers or other services when needed
   */
  async notifyApplicationChange(
    applicationId: string,
    candidateId?: string,
    hrId?: string,
    customMessage?: string
  ): Promise<void> {
    const application = await this.getApplicationById(applicationId);
    const recipients: string[] = [];

    // Add specified recipients or use application defaults
    if (candidateId) {
      recipients.push(candidateId);
    } else {
      recipients.push(application.candidateId.toString());
    }

    if (hrId) {
      recipients.push(hrId);
    } else if (application.assignedHr) {
      recipients.push(application.assignedHr.toString());
    }

    const notificationData: CreateNotificationDto = {
      recipientId: recipients,
      type: 'Info',
      deliveryType: 'MULTICAST',
      title: 'Application Update',
      message: customMessage || `There has been an update to your application (ID: ${applicationId}).`,
      relatedEntityId: applicationId,
      relatedModule: 'Recruitment',
      isRead: false,
    };

    try {
      await this.notificationService.create(notificationData);
    } catch (error) {
      console.error('Failed to send manual application notification:', error);
      throw new Error('Failed to send notification');
    }
  }

  // =================== INTERVIEW METHODS ===================

  /**
   * Create interview document for application
   */
  async createInterview(createInterviewDto: CreateInterviewDto): Promise<InterviewDocument> {
    // Validate application exists
    const application = await this.getApplicationById(createInterviewDto.applicationId);
    if (!application) {
      throw new NotFoundException(`Application with id ${createInterviewDto.applicationId} not found`);
    }
    if (!await this.validateEmployeeExistence(createInterviewDto.hrId, [SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE])) {
      throw new NotFoundException(`HR with id ${createInterviewDto.hrId} not found or does not have the required role`);
    }
    if (!createInterviewDto.panel || createInterviewDto.panel.length === 0) {
      throw new NotFoundException('At least one interviewer/panel member is required to schedule an interview');
    }
    if (createInterviewDto.scheduledDate <= new Date()) {
      throw new NotFoundException('Scheduled date and time for the interview must be in the future');
    }
    if (createInterviewDto.method === InterviewMethod.VIDEO && !createInterviewDto.videoLink) {
      throw new NotFoundException('Video link is required for video interviews');
    }
    if (createInterviewDto.method !== InterviewMethod.VIDEO && createInterviewDto.videoLink) {
      throw new NotFoundException('Video link should not be provided for non-video interviews');
    }
    if (new Set(createInterviewDto.panel).size !== createInterviewDto.panel.length) {
      throw new NotFoundException('Duplicate panel member IDs are not allowed');
    }
    // Validate stage is interview-related
    if (createInterviewDto.stage !== ApplicationStage.HR_INTERVIEW &&
      createInterviewDto.stage !== ApplicationStage.DEPARTMENT_INTERVIEW) {
      throw new NotFoundException('Interview can only be created for HR or Department interview stages');
    }

    const interviewData = {
      applicationId: new Types.ObjectId(createInterviewDto.applicationId),
      stage: createInterviewDto.stage,
      scheduledDate: createInterviewDto.scheduledDate,
      method: createInterviewDto.method,
      panel: createInterviewDto.panel.map(id => new Types.ObjectId(id)),
      calendarEventId: createInterviewDto.calendarEventId,
      videoLink: createInterviewDto.videoLink,
      status: createInterviewDto.status || InterviewStatus.SCHEDULED,
    };

    const savedInterview = await this.interviewRepository.create(interviewData);

    // Send notification about interview scheduling
    await this.sendInterviewNotification(savedInterview, application, 'scheduled');

    return savedInterview;
  }

  /**
   * Get interview by application ID and stage
   */
  async getInterviewByApplication(applicationId: string): Promise<InterviewDocument[]> {
    return await this.interviewRepository.findByApplicationId(applicationId);
  }

  /**
   * Update interview and send notifications
   */
  async updateInterview(interviewId: string, updateInterviewDto: UpdateInterviewDto): Promise<InterviewDocument> {
    // Validate HR exists and has proper role if hrId is provided
    if (updateInterviewDto.hrId) {
      const isValidHR = await this.validateEmployeeExistence(updateInterviewDto.hrId, [SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE]);
      if (!isValidHR) {
        throw new NotFoundException(`HR with id ${updateInterviewDto.hrId} is not valid or not active`);
      }
    }

    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) {
      throw new NotFoundException(`Interview with id ${interviewId} not found`);
    }

    // Prepare update data
    const updateData: any = {};
    if (updateInterviewDto.applicationId) updateData.applicationId = new Types.ObjectId(updateInterviewDto.applicationId);
    if (updateInterviewDto.stage) updateData.stage = updateInterviewDto.stage;
    if (updateInterviewDto.scheduledDate) updateData.scheduledDate = updateInterviewDto.scheduledDate;
    if (updateInterviewDto.method) updateData.method = updateInterviewDto.method;
    if (updateInterviewDto.panel) updateData.panel = updateInterviewDto.panel.map(id => new Types.ObjectId(id));
    if (updateInterviewDto.calendarEventId !== undefined) updateData.calendarEventId = updateInterviewDto.calendarEventId;
    if (updateInterviewDto.videoLink !== undefined) updateData.videoLink = updateInterviewDto.videoLink;
    if (updateInterviewDto.status) updateData.status = updateInterviewDto.status;
    if (updateInterviewDto.feedbackId) updateData.feedbackId = new Types.ObjectId(updateInterviewDto.feedbackId);
    if (updateInterviewDto.candidateFeedback !== undefined) updateData.candidateFeedback = updateInterviewDto.candidateFeedback;

    const application = await this.getApplicationById(interview.applicationId.toString());
    const updatedInterview = await this.interviewRepository.updateById(interviewId, updateData);

    if (!updatedInterview) {
      throw new NotFoundException(`Failed to update interview with id ${interviewId}`);
    }

    // Send notification about interview update
    await this.sendInterviewNotification(updatedInterview, application, updateInterviewDto.status || 'updated');

    return updatedInterview;
  }

  /**
   * Send interview-related notifications
   */
  private async sendInterviewNotification(
    interview: InterviewDocument,
    application: ApplicationDocument,
    action: string
  ): Promise<void> {
    const recipients: string[] = [];

    // Add candidate to recipients
    recipients.push(application.candidateId.toString());

    // Add assigned HR to recipients if exists
    if (application.assignedHr) {
      recipients.push(application.assignedHr.toString());
    }

    // Add panel members to recipients
    if (interview.panel && Array.isArray(interview.panel)) {
      interview.panel.forEach(panelMember => {
        recipients.push(panelMember.toString());
      });
    }

    let title = '';
    let message = '';
    let notificationType = 'Info';

    switch (action) {
      case 'scheduled':
        title = 'Interview Scheduled';
        message = `Your ${interview.stage.replace('_', ' ')} interview has been scheduled for ${interview.scheduledDate.toLocaleDateString()} at ${interview.scheduledDate.toLocaleTimeString()}. Method: ${interview.method}`;
        if (interview.videoLink) {
          message += ` Video Link: ${interview.videoLink}`;
        }
        break;
      case InterviewStatus.COMPLETED:
        title = 'Interview Completed';
        message = `Your ${interview.stage.replace('_', ' ')} interview has been completed. You will be notified of the next steps soon.`;
        notificationType = 'Success';
        break;
      case InterviewStatus.CANCELLED:
        title = 'Interview Cancelled';
        message = `Your ${interview.stage.replace('_', ' ')} interview scheduled for ${interview.scheduledDate.toLocaleDateString()} has been cancelled. You will be contacted to reschedule.`;
        notificationType = 'Alert';
        break;
      default:
        title = 'Interview Update';
        message = `There has been an update to your ${interview.stage.replace('_', ' ')} interview.`;
    }

    const notificationData: CreateNotificationDto = {
      recipientId: recipients,
      type: notificationType,
      deliveryType: 'MULTICAST',
      title,
      message,
      relatedEntityId: interview._id.toString(),
      relatedModule: 'Recruitment',
      isRead: false,
    };

    try {
      await this.notificationService.create(notificationData);
    } catch (error) {
      console.error('Failed to send interview notification:', error);
      // Don't throw error to prevent breaking the main interview flow
    }
  }

  /**
   * Helper method to automatically create interview when application stage changes
   * This is called internally by updateApplication method
   */
  /* private async autoCreateInterviewIfNeeded(
     updatedApplication: ApplicationDocument,
     previousApplication: ApplicationDocument,
     interviewData?: {
       scheduledDate: Date;
       method: InterviewMethod;
       panel: string[];
       calendarEventId?: string;
       videoLink?: string;
     }
   ): Promise<InterviewDocument | null> {
     const stageChanged = updatedApplication.currentStage !== previousApplication.currentStage;
     const isInterviewStage = updatedApplication.currentStage === ApplicationStage.HR_INTERVIEW || 
                              updatedApplication.currentStage === ApplicationStage.DEPARTMENT_INTERVIEW;
 
     if (stageChanged && isInterviewStage && interviewData) {
       // Check if interview already exists for this stage
       const existingInterview = await this.interviewRepository.findOne({
         applicationId: updatedApplication._id,
         stage: updatedApplication.currentStage
       });
 
       if (!existingInterview) {
         const createInterviewDto: CreateInterviewDto = {
           applicationId: updatedApplication._id.toString(),
           stage: updatedApplication.currentStage,
           scheduledDate: interviewData.scheduledDate,
           method: interviewData.method,
           panel: interviewData.panel,
           calendarEventId: interviewData.calendarEventId,
           videoLink: interviewData.videoLink,
         };
 
         return await this.createInterview(createInterviewDto);
       }
     }
 
     return null;
   }*/
  async createReferral(candidateId: string, createReferralDto: CreateReferralDto): Promise<ReferralDocument> {

    const isEmployeeValid = await this.validateEmployeeExistence(createReferralDto.referringEmployeeId, [SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN]);
    if (!isEmployeeValid) {
      throw new NotFoundException(`Employee with id ${createReferralDto.referringEmployeeId} is not valid or not active`);
    }
    if (!await this.validateCandidateExistence(candidateId)) {
      throw new NotFoundException(`Candidate with id ${candidateId} is not valid or not active`);
    }
    const referralData = {
      candidateId: new Types.ObjectId(candidateId),
      referringEmployeeId: new Types.ObjectId(createReferralDto.referringEmployeeId),
      role: createReferralDto.role,
      level: createReferralDto.level,
    };
    return await this.referralRepository.create(referralData);
  }

}