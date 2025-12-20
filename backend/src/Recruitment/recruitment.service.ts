import { Injectable, NotFoundException, BadRequestException, StreamableFile, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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
import { ConfigSetupService } from '../payroll-configuration/payroll-configuration.service';
import { EmployeeSigningBonusService } from '../payroll/execution/services/EmployeesigningBonus.service';

import { OfferResponseStatus } from './enums/offer-response-status.enum';
import { OfferFinalStatus } from './enums/offer-final-status.enum';

//
import { Types } from 'mongoose';
import { JobTemplateDocument } from './models/job-template.schema';
import { JobRequisitionDocument } from './models/job-requisition.schema';
import { ApplicationDocument } from './models/application.schema';

import { InterviewDocument } from './models/interview.schema';
import { ReferralDocument } from './models/referral.schema';
import { OfferDocument } from './models/offer.schema';
//import { ContractDocument } from './models/contract.schema';

import { NotificationService } from '../employee-subsystem/notification/notification.service';
import { ApplicationStage } from './enums/application-stage.enum';
import { ApplicationStatus } from './enums/application-status.enum';
import { InterviewStatus } from './enums/interview-status.enum';
import { InterviewMethod } from './enums/interview-method.enum';
import { /*SystemRole, EmployeeStatus,*/ CandidateStatus, SystemRole } from '../employee-subsystem/employee/enums/employee-profile.enums';
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
import { CreateAssessmentDto } from './dtos/create-assessment.dto';

//import { EmployeeProfileRepository } from '../employee-subsystem/employee/repository/employee-profile.repository';
import { CandidateRepository } from '../employee-subsystem/employee/repository/candidate.repository';

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
  OnboardingRepository,
  AssessmentResultRepository
} from './repositories';
import { AssessmentResultDocument } from './models/assessment-result.schema';

@Injectable()
export class RecruitmentService {
  constructor(
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
    private readonly assessmentResultRepository: AssessmentResultRepository,

    private readonly notificationService: NotificationService,
    // private readonly employeeProfileRepository: EmployeeProfileRepository,
    private readonly candidateRepository: CandidateRepository,
    //private readonly employeeSystemRoleRepository: EmployeeSystemRoleRepository,
    //   private readonly employeeSystemRoleRepository: EmployeeSystemRoleRepository,
    private readonly configSetupService: ConfigSetupService,
    private readonly employeeSigningBonusService: EmployeeSigningBonusService,
    //private payrollExecutionService: PayrollExecutionService,
  ) { }

  // need guards for auth and roles
  //REC-018
  //REC-018
  async createOffer(dto: CreateOfferDto, userId?: string) {
    const { applicationId, candidateId, role, benefits, conditions, insurances, content, deadline } = dto;

    // STRICT: Always use the authenticated user's ID as the HR Employee ID
    // We ignore any hrEmployeeId passed in the DTO to ensure security and source of truth
    const hrEmployeeId = userId;

    if (!hrEmployeeId) {
      throw new BadRequestException('HR Employee ID is required');
    }

    // Validate application exists
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) {
      throw new NotFoundException(`Application with id ${applicationId} not found`);
    }

    // Validate candidate exists
    const isCandidateValid = await this.validateCandidateExistence(candidateId);
    if (!isCandidateValid) {
      throw new NotFoundException(`Candidate with id ${candidateId} is not valid or not active`);
    }

    // Check if an offer already exists for this application
    const existingOffer = await this.offerRepository.findOne({
      applicationId: new mongoose.Types.ObjectId(applicationId)
    });

    if (existingOffer) {
      throw new BadRequestException(`An offer already exists for this application. Please edit the existing offer instead of creating a new one.`);
    }

    // Validate HR employee exists and has proper role
    /*const isValidHR = await this.validateEmployeeExistence(hrEmployeeId, [SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE]);
    if (!isValidHR) {
      throw new NotFoundException(`HR Employee with id ${hrEmployeeId} is not valid or not active`);
    }*/

    // Lookup signing bonus by role/position from payroll configuration
    const bonusConfig = await this.configSetupService.signingBonus.findOne({
      positionName: role,
      status: 'approved'
    });

    // Lookup gross salary by role/position from payroll configuration
    const salaryConfig = await this.configSetupService.payGrade.findOne({
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
    const { offerId, employeeId: inputId } = dto;
    let employeeId = inputId;

    // Resolve Employee ID from Number if necessary (not a valid ObjectId)
    if (!mongoose.isValidObjectId(inputId)) {
      const employee = await this.employeeService.findByEmployeeNumber(inputId);
      if (!employee) {
        throw new NotFoundException(`Employee with number ${inputId} not found`);
      }
      employeeId = String((employee as any)._id || (employee as any).id);
    }

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

    // Add new approver with pending status and default role
    offer.approvers.push({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      role: 'Approver',
      status: 'pending',
      actionDate: null,
      comment: null,
    });

    await this.offerRepository.updateById(offerId, { approvers: offer.approvers });

    // Notify the new approver
    try {
      await this.notificationService.create({
        recipientId: [employeeId],
        type: 'Info',
        deliveryType: 'UNICAST',
        title: 'Offer Approval Request',
        message: `You have been added as an approver for offer ${offerId}.`,
        relatedModule: 'Recruitment',
        isRead: false,
      });
    } catch (e) {
      console.warn('Failed to send notification to new approver', e);
    }
    try {
      await this.offerRepository.updateById(offerId, {
        finalStatus: OfferFinalStatus.PENDING
      });
    } catch (e) {
      console.warn('Failed to update offer final status', e);
    }

    return {
      success: true,
      message: 'Approver added successfully',
      offer,
    };
  }

  // need guards for auth and roles
  //REC-014
  async approveOffer(dto: ApproveOfferDto, employeeId: string) {
    const { offerId, status, comment } = dto;

    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    /*
        // Validate employee exists and is active
        const isValidEmployee = await this.validateEmployeeExistence(employeeId, [SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_MANAGER]);
        if (!isValidEmployee) {
          throw new NotFoundException(`Employee with id ${employeeId} is not valid or not active`);
        }*/

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
    } else if (allApproved) {
      offer.finalStatus = OfferFinalStatus.APPROVED;
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
    /*
        // Validate HR employee who created the offer still exists and is active
        const isValidHR = await this.validateEmployeeExistence(offer.hrEmployeeId.toString(), [SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE]);
        if (!isValidHR) {
          throw new NotFoundException(`HR Employee who created this offer (${offer.hrEmployeeId}) is not valid or not active`);
        }
    */
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
    await this.notificationService.create({
      recipientId: [offer.candidateId.toString()],
      type: 'Info',
      deliveryType: 'UNICAST',
      title: 'Job Offer Sent',
      message: `Your job offer for ${offer.role} has been sent. Please review and respond.`,
      relatedModule: 'Recruitment',
      isRead: false,
    });

    return {
      success: true,
      message: 'Offer sent to candidate successfully',
      offer,
    };
  }

  // need guards for auth and roles
  //REC-029
  async candidateRespondOffer(dto: CandidateRespondOfferDto, candidateId: string) {
    const { offerId, response, notes } = dto;

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
      await this.notificationService.create({
        recipientId: [offer.hrEmployeeId.toString()],
        type: 'Success',
        deliveryType: 'UNICAST',
        title: 'Offer Accepted',
        message: `Candidate has accepted the offer for ${offer.role}. Contract has been created. Please proceed with contract signing.`,
        relatedModule: 'Recruitment',
        isRead: false,
      });

    } else if (response === 'rejected') {
      offer.finalStatus = OfferFinalStatus.REJECTED;

      // Update candidate status to REJECTED
      await this.employeeService.updateCandidateStatus(
        candidateId,
        { status: CandidateStatus.REJECTED } as UpdateCandidateStatusDto
      );

      // Notify HR
      await this.notificationService.create({
        recipientId: [offer.hrEmployeeId.toString()],
        type: 'Warning',
        deliveryType: 'UNICAST',
        title: 'Offer Rejected',
        message: `Candidate has rejected the offer for ${offer.role}. ${notes || ''}`,
        relatedModule: 'Recruitment',
        isRead: false,
      });
    }

    await offer.save();

    return {
      success: true,
      message: `Offer ${response} successfully`,
      offer,
    };
  }

  // need guards for auth and roles
  async signContract(dto: UploadSignedContractDto, files: any[], userCandidateId: string) {
    const { contractId, mainContractFileIndex, signedAt, documentTypes } = dto;
    const candidateId = dto.candidateId || userCandidateId;

    const contract = await this.contractRepository.findById(contractId);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Validate candidate exists
    if (!candidateId) {
      throw new BadRequestException('Candidate ID is required to sign contract');
    }

    const isCandidateValid = await this.validateCandidateExistence(candidateId);
    if (!isCandidateValid) {
      throw new NotFoundException(`Candidate with id ${candidateId} is not valid or not active`);
    }

    // Get the offer associated with this contract to verify candidate ownership
    const offer = await this.offerRepository.findById(contract.offerId?.toString());

    if (!offer) {
      throw new NotFoundException('Offer associated with this contract not found');
    }

    // Verify that the candidate signing is the same candidate who received the offer
    const offerCandidateId = offer.candidateId?.toString();
    if (!offerCandidateId) {
      throw new BadRequestException('Offer does not have a valid candidate ID');
    }

    if (offerCandidateId !== candidateId) {
      throw new BadRequestException('This contract does not belong to you. You can only sign your own contract.');
    }

    // Validate that at least one contract document is provided
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one contract document must be uploaded when signing the contract');
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

      // Fetch candidate to get readable candidate number for file naming
      const candidate = await this.candidateRepository.findById(candidateId || '');
      const filePrefix = candidate ? candidate.candidateNumber : (candidateId || 'unknown');

      // Save file with naming convention and check for conflict
      const fileName = this.saveUploadedFile(f, filePrefix);

      const docData = {
        ownerId: candidateId ? new mongoose.Types.ObjectId(candidateId) : undefined,
        type: docType,
        filePath: fileName,
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
  async hrSignContract(dto: HrSignContractDto, hrEmployeeId: string) {
    const { contractId, signedAt, useCustomEmployeeData } = dto;

    const contract = await this.contractRepository.findById(contractId);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (!contract.employeeSignedAt) {
      throw new BadRequestException('Employee must sign the contract first');
    }

    // Get candidateId from the offer for onboarding and bonus processing
    if (!contract?.offerId) {
      throw new NotFoundException('Contract does not have an associated offer');
    }

    // Fetch the offer to get candidate information
    const offer = await this.offerRepository.findById(contract.offerId.toString());

    if (!offer) {
      throw new NotFoundException('Offer associated with this contract not found');
    }

    // Automatically trigger onboarding when BOTH employee and HR have signed
    if (offer.candidateId) {
      // Fetch the candidate details
      const candidate = await this.candidateRepository.findByIdWithPassword(offer.candidateId.toString());

      if (!candidate) {
        throw new NotFoundException('Candidate associated with this offer not found');
      }

      // Update candidate status to HIRED
      await this.employeeService.updateCandidateStatus(
        offer.candidateId.toString(),
        { status: CandidateStatus.HIRED } as UpdateCandidateStatusDto
      );

      // Create employee profile using either custom data or candidate's data
      let employeeData: any;

      if (useCustomEmployeeData) {
        // Use custom employee data provided by HR
        employeeData = {
          firstName: dto.customFirstName || candidate.firstName || 'New',
          lastName: dto.customLastName || candidate.lastName || 'Employee',
          nationalId: dto.customNationalId || candidate.nationalId,
          employeeNumber: `EMP-${candidate.candidateNumber.slice(4)}`,
          dateOfHire: new Date(),
          workEmail: dto.customWorkEmail || candidate.personalEmail,
          personalEmail: dto.customPersonalEmail || candidate.personalEmail || dto.customWorkEmail,
          status: dto.customStatus || 'PROBATION' as any,
          contractStartDate: new Date(),
          contractType: dto.customContractType || 'FULL_TIME_CONTRACT' as any,
          workType: dto.customWorkType || 'FULL_TIME' as any,
          password: candidate.password, // Transfer hashed password
        };
      } else {
        // Use candidate's data (default behavior)
        employeeData = {
          firstName: candidate.firstName || 'New',
          lastName: candidate.lastName || 'Employee',
          nationalId: candidate.nationalId,
          employeeNumber: `EMP-${candidate.candidateNumber.slice(4)}`,
          dateOfHire: new Date(),
          workEmail: candidate.personalEmail,
          personalEmail: candidate.personalEmail,
          status: 'PROBATION' as any,
          contractStartDate: new Date(),
          contractType: 'FULL_TIME_CONTRACT' as any,
          workType: 'FULL_TIME' as any,
          password: candidate.password, // Transfer hashed password
        };
      }

      // Validate that employee has a national ID
      if (!employeeData.nationalId) {
        throw new BadRequestException('Employee must have a national ID before creating employee profile');
      }

      // Check if employee already exists with this national ID or employee number
      let employeeProfileId: string;
      try {
        const createdEmployee = await this.employeeService.onboard(employeeData);
        employeeProfileId = String((createdEmployee as any)._id || (createdEmployee as any).id);

        // Assign 'department employee' role to the new employee
        console.log(`📝 [RecruitmentService.hrSignContract] Assigning 'department employee' role to new employee ${employeeProfileId}`);
        await this.employeeService.assignRoles(employeeProfileId, {
          roles: [SystemRole.DEPARTMENT_EMPLOYEE],
          permissions: []
        });
      } catch (error) {
        // Re-throw the error from employee service (already formatted as BadRequestException)
        throw error;
      }

      // ONLY sign the contract AFTER successful employee creation
      const updateData: any = {
        employerSignedAt: signedAt ? new Date(signedAt) : new Date()
      };

      // optionally store which HR employee signed
      if (hrEmployeeId) {
        updateData.employerSignatureUrl = `hr-signed-by-${hrEmployeeId}`;
      }

      await this.contractRepository.updateById(contractId, updateData);

      // Calculate next working day (skip weekends)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Next day

      // Skip weekends: if Saturday (6) or Sunday (0), move to Monday
      while (startDate.getDay() === 0 || startDate.getDay() === 6) {
        startDate.setDate(startDate.getDate() + 1);
      }

      await this.createOnboardingWithDefaults({
        employeeId: employeeProfileId,
        contractId: contractId,
        startDate: startDate.toISOString(),
        includeITTasks: true,
        includeAdminTasks: true,
        includeHRTasks: true,
        employeeNumber: employeeData.employeeNumber,
      });

      // Send notification to new employee with their employee details
      await this.notificationService.create({
        recipientId: [employeeProfileId],
        type: 'Success',
        deliveryType: 'UNICAST',
        title: 'Welcome to the Team!',
        message: `Congratulations! Your employee profile has been created. Your Employee ID: ${employeeData.employeeNumber}. Work Email: ${employeeData.workEmail || 'Will be assigned'}. Your start date is ${startDate.toDateString()}. Please check your onboarding checklist for tasks to complete.`,
        relatedModule: 'Recruitment',
        isRead: false,
      });

      // Send notification to candidate (before they become employee) about acceptance
      await this.notificationService.create({
        recipientId: [offer.candidateId.toString()],
        type: 'Success',
        deliveryType: 'UNICAST',
        title: 'Contract Fully Signed - You Are Hired!',
        message: `Congratulations! Your employment contract has been fully signed by HR. You have been officially hired! Your Employee ID is: ${employeeData.employeeNumber}. Your work email will be: ${employeeData.workEmail || 'assigned soon'}. Your start date is ${startDate.toDateString()}. Welcome to the team!`,
        relatedModule: 'Recruitment',
        isRead: false,
      });

      // Get updated contract after signing
      const updatedContract = await this.contractRepository.findById(contractId);

      if (!updatedContract) {
        throw new NotFoundException('Contract not found after signing');
      }

      // Automatically process signing bonus when BOTH employee and HR have signed
      if (updatedContract.signingBonus && updatedContract.signingBonus > 0 && updatedContract.role) {
        await this.processSigningBonusForNewHire(
          employeeProfileId,
          updatedContract.role,
          employeeData.employeeNumber
        );
      }

      // Decrement job requisition openings and update status if needed
      if (offer.applicationId) {
        try {
          const application = await this.applicationRepository.findById(offer.applicationId.toString());
          if (application && application.requisitionId) {
            const requisition = await this.jobRequisitionRepository.findById(application.requisitionId.toString());
            if (requisition && requisition.openings > 0) {
              const newOpenings = requisition.openings - 1;
              const updateData: any = { openings: newOpenings };

              // If openings reach 0, close the requisition
              if (newOpenings === 0) {
                updateData.publishStatus = 'closed';
              }

              await this.jobRequisitionRepository.updateById(requisition._id.toString(), updateData);
              console.log(`✅ Job requisition ${requisition.requisitionId} openings decremented to ${newOpenings}. Status: ${updateData.publishStatus || requisition.publishStatus}`);
            }
          }
        } catch (error) {
          console.error('Failed to decrement job requisition openings:', error);
          // Don't fail the contract signing if this fails
        }
      }

      return updatedContract;
    }

    // If no candidate, just sign the contract
    const updateData: any = {
      employerSignedAt: signedAt ? new Date(signedAt) : new Date()
    };

    if (hrEmployeeId) {
      updateData.employerSignatureUrl = `hr-signed-by-${hrEmployeeId}`;
    }

    await this.contractRepository.updateById(contractId, updateData);
    const finalContract = await this.contractRepository.findById(contractId);

    if (!finalContract) {
      throw new NotFoundException('Contract not found after signing');
    }

    return finalContract;
  }

  /**
   * Process signing bonus for new hire after contract is fully signed
   * ONB-019: Automatically create employee signing bonus record
   */
  async processSigningBonusForNewHire(employeeId: string, positionName: string, employeeNumber?: string): Promise<void> {
    try {
      // Create employee signing bonus record using the payroll execution service
      await this.employeeSigningBonusService.createEmployeeSigningBonus({
        employeeId,
        positionName,
      });

      // Send notification to HR about signing bonus creation
      await this.notificationService.create({
        recipientId: [],
        type: 'Info',
        deliveryType: 'MULTICAST',
        deliverToRole: SystemRole.HR_MANAGER,
        title: 'Signing Bonus Record Created',
        message: `Signing bonus record has been automatically created for employee ${employeeNumber || employeeId} for position ${positionName}. Status: Pending approval.`,
        relatedModule: 'Recruitment',
        isRead: false,
      });
    } catch (error) {
      console.error('Failed to process signing bonus for new hire:', error);
      // Send error notification to HR
      await this.notificationService.create({
        recipientId: [],
        type: 'Alert',
        deliveryType: 'MULTICAST',
        deliverToRole: SystemRole.HR_MANAGER,
        title: 'Signing Bonus Processing Failed',
        message: `Failed to create signing bonus record for employee ${employeeNumber || employeeId}. Position: ${positionName}. Please create manually. Error: ${error.message || 'Unknown error'}`,
        relatedModule: 'Recruitment',
        isRead: false,
      });
    }
  }

  /**
   * Helper to save uploaded file with specific naming convention and conflict check
   */
  private saveUploadedFile(file: any, ownerId: string): string {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const originalName = file.originalname || 'unknown_file';
    const fileName = `${ownerId}_${originalName}`;
    const filePath = path.join(uploadsDir, fileName);

    if (fs.existsSync(filePath)) {
      throw new BadRequestException(`File '${fileName}' already exists.`);
    }

    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
    } else if (file.path) {
      // Should probably copy/move if it's already a temp file
      fs.copyFileSync(file.path, filePath);
    }

    return fileName;
  }

  // need guards for auth and roles
  //ONB-007
  async uploadComplianceDocuments(dto: UploadComplianceDocumentsDto, files: any[], userId?: string) {
    const { employeeId: dtoEmployeeId, documentTypes } = dto;
    const employeeId = dtoEmployeeId || userId;

    if (!employeeId) {
      throw new BadRequestException('Employee ID is required');
    }

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

      // Fetch employee profile to get readable employee number
      let filePrefix = employeeId;
      try {
        const { profile } = await this.employeeService.getProfile(employeeId);
        if (profile && profile.employeeNumber) {
          filePrefix = profile.employeeNumber;
        }
      } catch (error) {
        console.warn(`Could not fetch employee profile for ${employeeId}, falling back to ID for file naming`);
      }

      // Save file with naming convention and check for conflict
      const fileName = this.saveUploadedFile(f, filePrefix);

      const docData = {
        ownerId: new mongoose.Types.ObjectId(employeeId),
        type: docType,
        filePath: fileName,
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

  async getDocumentFile(documentId: string, user: any): Promise<{ file: StreamableFile; filename: string; mimeType: string }> {
    const doc = await this.documentRepository.findById(documentId);
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    // Security Check: Ensure user is owner OR has HR/Admin roles
    const userId = user.sub;
    const isOwner = doc.ownerId && doc.ownerId.toString() === userId;

    if (!isOwner) {
      let hasPrivilegedRole = false;
      try {
        // Fetch user roles to check for HR/Admin privileges
        const { systemRole } = await this.employeeService.getProfile(userId);
        const roles = systemRole?.roles || [];
        // Define privileged roles (adjust based on your SystemRole enum)
        const privilegedRoles = ['HR_MANAGER', 'HR_ADMIN', 'HR_EMPLOYEE', 'SYSTEM_ADMIN', 'RECRUITER', 'DEPARTMENT_HEAD'];
        hasPrivilegedRole = true;

        if (roles.some((r: string) => privilegedRoles.includes(r))) {
          hasPrivilegedRole = true;
        }
      } catch (e) {
        // If profile fetch fails, deny access
        console.warn(`Failed to fetch profile for security check: ${userId}`, e);
      }

      if (!hasPrivilegedRole) {
        throw new ForbiddenException('You do not have permission to view this document');
      }
    }

    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    const filePath = path.join(uploadsDir, doc.filePath);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on server');
    }

    const file = fs.createReadStream(filePath);

    // Determine mime type based on extension (simple fallback)
    const ext = path.extname(doc.filePath).toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.txt') mimeType = 'text/plain';

    return {
      file: new StreamableFile(file),
      filename: doc.filePath,
      mimeType
    };
  }

  async getEmployeeDocuments(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.documentRepository.findByOwnerId(userId);
  }

  // need guards for auth and roles
  //ONB-001
  async createOnboardingChecklist(dto: CreateOnboardingChecklistDto) {
    const { employeeId: inputId, tasks } = dto;
    let employeeId = inputId;
    let employeeDisplayNumber = inputId; // Will store the readable employee number

    // Resolve Employee ID from Number if necessary
    if (!mongoose.isValidObjectId(inputId)) {
      const employee = await this.employeeService.findByEmployeeNumber(inputId);
      if (!employee) {
        throw new NotFoundException(`Employee with number ${inputId} not found`);
      }
      employeeId = String((employee as any)._id || (employee as any).id);
      employeeDisplayNumber = inputId; // inputId is already the employee number
    } else {
      // Double check it exists if it is an ID, and fetch the employee number
      try {
        const profileData = await this.employeeService.getProfile(inputId);
        const employee = (profileData as any).profile || profileData;
        if (!employee) throw new Error();
        employeeDisplayNumber = employee.employeeNumber || inputId;
      } catch {
        // If valid object ID but not found, try searching as number (unlikely but safe)
        const employee = await this.employeeService.findByEmployeeNumber(inputId);
        if (employee) {
          employeeId = String((employee as any)._id || (employee as any).id);
          employeeDisplayNumber = (employee as any).employeeNumber || inputId;
        }
      }
    }

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

      // Notify departments for new tasks
      const departmentsToNotify = [...new Set(formattedTasks.map(t => t.department))].filter(Boolean);

      for (const department of departmentsToNotify) {
        const tasksForDept = formattedTasks.filter(t => t.department === department);
        const taskNames = tasksForDept.map(t => t.name).join(', ');

        // Collect notes from tasks
        const taskNotes = tasksForDept
          .filter(t => t.notes)
          .map(t => `${t.name}: ${t.notes}`)
          .join('; ');

        // Find the earliest deadline for the message
        const departmentDeadlines = tasksForDept.map(t => t.deadline).filter(d => !!d) as Date[];
        const minDeadline = departmentDeadlines.length > 0
          ? new Date(Math.min(...departmentDeadlines.map(d => d.getTime())))
          : null;
        const deadlineStr = minDeadline ? minDeadline.toDateString() : 'ASAP';

        const notesSection = taskNotes ? ` Notes: ${taskNotes}.` : '';

        try {
          await this.notificationService.create({
            recipientId: [],
            type: 'Info',
            deliveryType: 'MULTICAST',
            deliverToRole: department as SystemRole,
            title: 'New Onboarding Tasks Assigned',
            message: `New onboarding tasks assigned for employee ${employeeDisplayNumber}. Tasks: ${taskNames}. Deadline: ${deadlineStr}.${notesSection}`,
            relatedModule: 'Recruitment',
            isRead: false,
          });
        } catch (error) {
          console.error(`Failed to send notification to ${department}:`, error);
        }
      }

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

    // VALIDATE CONTRACT BELONGS TO EMPLOYEE
    const contract = await this.contractRepository.findById(dto.contractId);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // 1. If contract has an explicit Offer, check linkage via Candidate
    if (contract.offerId) {
      const offer = await this.offerRepository.findById(contract.offerId.toString());
      if (offer && offer.candidateId) {
        // Get candidate info
        const candidate = await this.candidateRepository.findById(offer.candidateId.toString());
        // Get employee info
        const employee = await this.employeeService.getProfile(employeeId);

        if (candidate && employee) {
          const employeeObj = (employee as any).profile || employee; // handle structure from getProfile
          const candidateNumFromEmp = employeeObj.employeeNumber?.replace('EMP-', 'CAN-');

          // Check if employee number matches candidate number logic OR if personal emails match
          const isMatch = (candidate.candidateNumber === candidateNumFromEmp) ||
            (candidate.personalEmail === employeeObj.personalEmail);

          if (!isMatch) {
            throw new BadRequestException("This contract does not belong to the specified employee (Candidate mismatch).");
          }
        }
      }
    }

    const onboardingData = {
      employeeId: new mongoose.Types.ObjectId(employeeId),
      contractId: new mongoose.Types.ObjectId(dto.contractId),
      tasks: formattedTasks,
      completed: false,
    };

    onboarding = await this.onboardingRepository.create(onboardingData);

    // Notify departments
    const departmentsToNotify = [...new Set(formattedTasks.map(t => t.department))].filter(Boolean);

    for (const department of departmentsToNotify) {
      const tasksForDept = formattedTasks.filter(t => t.department === department);
      const taskNames = tasksForDept.map(t => t.name).join(', ');

      // Collect notes from tasks
      const taskNotes = tasksForDept
        .filter(t => t.notes)
        .map(t => `${t.name}: ${t.notes}`)
        .join('; ');

      // Find the earliest deadline for the message
      const departmentDeadlines = tasksForDept.map(t => t.deadline).filter(d => !!d) as Date[];
      const minDeadline = departmentDeadlines.length > 0
        ? new Date(Math.min(...departmentDeadlines.map(d => d.getTime())))
        : null;
      const deadlineStr = minDeadline ? minDeadline.toDateString() : 'ASAP';

      const notesSection = taskNotes ? ` Notes: ${taskNotes}.` : '';

      try {
        await this.notificationService.create({
          recipientId: [],
          type: 'Info',
          deliveryType: 'MULTICAST',
          deliverToRole: department as SystemRole,
          title: 'New Onboarding Tasks Assigned',
          message: `New onboarding tasks assigned for employee ${employeeDisplayNumber}. Tasks: ${taskNames}. Deadline: ${deadlineStr}.${notesSection}`,
          relatedModule: 'Recruitment',
          isRead: false,
        });
      } catch (error) {
        console.error(`Failed to send notification to ${department}:`, error);
      }
    }

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
    const { employeeId, contractId, startDate, includeITTasks = true, includeAdminTasks = true, includeHRTasks = true, employeeNumber } = dto;

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
      const itAdminTasksList: string[] = [];
      if (includeITTasks) itAdminTasksList.push('IT setup tasks (Email, Laptop, System Access)');
      if (includeAdminTasks) itAdminTasksList.push('Admin tasks (Workspace, ID Badge)');

      await this.notificationService.create({
        recipientId: [],
        type: 'Info',
        deliveryType: 'MULTICAST',
        deliverToRole: SystemRole.SYSTEM_ADMIN,
        title: 'New Employee Onboarding Tasks Assigned',
        message: `New onboarding tasks have been created for employee ${employeeNumber || employeeId}. Tasks: ${itAdminTasksList.join(', ')}. Deadline: ${deadline.toDateString()}. Total tasks: ${itAdminTaskCount}.`,
        relatedModule: 'Recruitment',
        isRead: false,
      });
    }

    // Send notification to Payroll for HR tasks (Payroll & Benefits)
    if (includeHRTasks) {
      const hrTaskCount = 2; // Setup Payroll, Enroll in Benefits
      const hrTasksList: string[] = ['Payroll setup (Initialize account)', 'Benefits enrollment (Health insurance)'];

      await this.notificationService.create({
        recipientId: [],
        type: 'Info',
        deliveryType: 'MULTICAST',
        deliverToRole: SystemRole.PAYROLL_SPECIALIST,
        title: 'New Payroll & Benefits Onboarding Tasks',
        message: `New payroll and benefits tasks created for employee ${employeeNumber || employeeId}. Tasks: ${hrTasksList.join(', ')}. Deadline: ${deadline.toDateString()}. Total tasks: ${hrTaskCount}.`,
        relatedModule: 'Recruitment',
        isRead: false,
      });
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
  async getAllOnboardingChecklists() {
    const onboardings = await this.onboardingRepository.find();

    const populatedOnboardings = await Promise.all(
      onboardings.map(o => o.populate('employeeId', 'employeeNumber firstName lastName'))
    );

    // Calculate progress for each onboarding
    const onboardingsWithProgress = populatedOnboardings.map(onboarding => {
      const totalTasks = onboarding.tasks.length;
      const completedTasks = onboarding.tasks.filter(t => t.status === OnboardingTaskStatus.COMPLETED).length;
      const inProgressTasks = onboarding.tasks.filter(t => t.status === OnboardingTaskStatus.IN_PROGRESS).length;
      const pendingTasks = onboarding.tasks.filter(t => t.status === OnboardingTaskStatus.PENDING).length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        onboarding,
        progress: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingTasks,
          progressPercentage,
        },
      };
    });

    return {
      success: true,
      total: onboardings.length,
      checklists: onboardingsWithProgress,
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

    // Find tasks that are not completed and have deadlines
    for (const task of onboarding.tasks) {
      if (task.status !== OnboardingTaskStatus.COMPLETED && task.deadline) {
        const taskDeadline = new Date(task.deadline);

        let title = 'Onboarding Task Reminder';
        let message = '';
        let recipientIds = [employeeId];
        let deliverToRole: SystemRole | undefined = undefined;
        let deliveryType = 'UNICAST';
        let type = 'Warning';

        if (taskDeadline >= now && taskDeadline <= reminderThreshold) {
          // Upcoming reminder
          const daysUntilDeadline = Math.ceil((taskDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          message = `Reminder: Onboarding task "${task.name}" is due in ${daysUntilDeadline} day(s). Department: ${task.department || 'N/A'}`;
        } else if (taskDeadline < now) {
          // Overdue logic
          const daysOverdue = Math.floor((now.getTime() - taskDeadline.getTime()) / (1000 * 60 * 60 * 24)) + 1;

          if (daysOverdue <= 7) {
            // Countdown for employee
            const daysLeftToEscalation = 7 - daysOverdue;
            title = 'URGENT: Onboarding Task OVERDUE';
            type = 'Alert';
            message = `URGENT: Onboarding task "${task.name}" is OVERDUE. You have ${daysLeftToEscalation} day(s) left until termination process is initiated.`;
          } else {
            // Escalation to HR Manager
            try {
              const employee = await this.employeeService.findById(employeeId);
              const employeeName = employee ? `${(employee as any).firstName} ${(employee as any).lastName}` : employeeId;

              title = 'Onboarding Escalation: Action Required';
              type = 'Alert';
              message = `Escalation: Employee ${employeeName} has failed to complete onboarding task "${task.name}" within 7 days of the deadline. Recommended action: Initiate termination.`;
              recipientIds = []; // Broadcast to role
              deliverToRole = SystemRole.SYSTEM_ADMIN;
              deliveryType = 'MULTICAST';
            } catch (e) {
              console.error('Failed to fetch employee for escalation:', e);
              continue;
            }
          }
        } else {
          // Future task beyond threshold
          continue;
        }

        // Prevent spamming: Check if a similar notification was sent in the last 24 hours
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const existingNotifications = await this.notificationService.findByRecipientId(employeeId);

        const recentDuplicate = existingNotifications.find(n =>
          (n as any).title === title &&
          (n as any).message === message &&
          new Date((n as any).createdAt) > oneDayAgo
        );

        if (!recentDuplicate) {
          const notification = await this.notificationService.create({
            recipientId: recipientIds,
            type,
            deliveryType,
            deliverToRole,
            title,
            message,
            relatedModule: 'Recruitment',
            isRead: false,
          });
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
  async updateTaskStatus(dto: UpdateTaskStatusDto, userId?: string) {
    const { employeeId: dtoEmployeeId, taskName, status, documentId } = dto;
    const employeeId = dtoEmployeeId || userId;

    if (!employeeId) {
      throw new BadRequestException('Employee ID is required');
    }

    const onboarding = await this.onboardingRepository.findByEmployeeId(employeeId);

    if (!onboarding) {
      throw new NotFoundException('No onboarding checklist found for this employee');
    }

    const taskIndex = onboarding.tasks.findIndex(t => t.name === taskName);
    if (taskIndex === -1) {
      throw new NotFoundException(`Task "${taskName}" not found in onboarding checklist`);
    }

    // Update the task in the tasks array
    onboarding.tasks[taskIndex].status = status as OnboardingTaskStatus;
    if (status === OnboardingTaskStatus.COMPLETED) {
      onboarding.tasks[taskIndex].completedAt = new Date();
    }
    if (documentId) {
      onboarding.tasks[taskIndex].documentId = new mongoose.Types.ObjectId(documentId);
    }

    // Check if all tasks are completed
    const allCompleted = onboarding.tasks.every(t => t.status === OnboardingTaskStatus.COMPLETED);

    // Use updateById to avoid full document validation
    const updateData: any = {
      tasks: onboarding.tasks,
    };

    if (allCompleted) {
      updateData.completed = true;
      updateData.completedAt = new Date();

      // Notify System Admin regarding probation conversion
      try {
        const employee = await this.employeeService.findById(employeeId);
        const employeeName = employee ? `${(employee as any).firstName} ${(employee as any).lastName}` : employeeId;

        await this.notificationService.create({
          recipientId: [], // Broadcast to role
          type: 'Info',
          deliveryType: 'MULTICAST',
          deliverToRole: SystemRole.SYSTEM_ADMIN,
          title: 'Onboarding Checklist Completed',
          message: `Employee ${employeeName} has completed all onboarding tasks. Tasks: Convert from probation. Deadline: ASAP.`,
          relatedEntityId: onboarding._id.toString(),
          relatedModule: 'Recruitment',
          isRead: false,
        });
      } catch (notifError) {
        console.error('Failed to notify System Admin on onboarding completion:', notifError);
      }
    }

    const updatedOnboarding = await this.onboardingRepository.updateById(
      onboarding._id.toString(),
      updateData
    );

    return {
      success: true,
      message: `Task "${taskName}" updated to ${status}`,
      onboarding: updatedOnboarding,
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

    await this.notificationService.create({
      recipientId: [employeeId],
      type: 'Alert',
      deliveryType: 'UNICAST',
      title: 'Onboarding Cancelled',
      message: `Onboarding cancelled due to: ${reason}. ${notes || ''}`,
      relatedModule: 'Recruitment',
      isRead: false,
    });

    return {
      success: true,
      message: 'Onboarding cancelled successfully',
      reason,
      onboarding,
    };
  }
  // ADDING AHMED'S STUFF HERE

  /*async validateEmployeeExistence(employeeId: string, roles: SystemRole[]): Promise<boolean> {
    return true
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
  }*/

  // Helper method to check if employee has HR role
  /* private async checkIfEmployeeIsAsExpected(employee: EmployeeProfileDocument | any, roles: SystemRole[]): Promise<boolean> {
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
 */
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

  async getAllJobTemplates(): Promise<JobTemplateDocument[]> {
    return await this.jobTemplateRepository.find();
  }

  async createjob_requision(createjob_requision: CreateJobRequisitionDto, userId?: string): Promise<JobRequisitionDocument> {
    const templateExists = await this.jobTemplateRepository.findById(createjob_requision.templateId);
    if (!templateExists) {
      throw new NotFoundException(`Job template with id ${createjob_requision.templateId} not found`);
    }
    if (createjob_requision.openings <= 0) {
      throw new NotFoundException(`Number of openings must be greater than zero`);
    }

    const hiringManagerId = userId || createjob_requision.hiringManagerId;
    if (!hiringManagerId) {
      throw new NotFoundException(`Hiring Manager ID is required`);
    }
    /* const isHiringManagerValid = await this.validateEmployeeExistence(hiringManagerId, [SystemRole.HR_MANAGER, SystemRole.HR_ADMIN]);
     if (!isHiringManagerValid) {
       throw new NotFoundException(`Hiring Manager with id ${hiringManagerId} is not valid or not active`);
     }*/
    const jobRequisitionData = {
      ...createjob_requision,
      templateId: new Types.ObjectId(createjob_requision.templateId),
      hiringManagerId: new Types.ObjectId(hiringManagerId),
      postingDate: createjob_requision.postingDate ? new Date(createjob_requision.postingDate) : undefined,
      expiryDate: createjob_requision.expiryDate ? new Date(createjob_requision.expiryDate) : undefined
    };
    return await this.jobRequisitionRepository.create(jobRequisitionData);
  }

  //HELPS IN Doing REC-023
  async updatejob_requisition(requisitionId: string, updatejob_requisition: UpdateJobRequisitionDto): Promise<JobRequisitionDocument> {
    // Only validate template if it's being updated
    if (updatejob_requisition.templateId) {
      const templateExists = await this.jobTemplateRepository.findById(updatejob_requisition.templateId);
      if (!templateExists) {
        throw new NotFoundException(`Job template with id ${updatejob_requisition.templateId} not found`);
      }
    }

    if (updatejob_requisition.openings !== undefined && updatejob_requisition.openings <= 0) {
      throw new BadRequestException(`Number of openings must be greater than zero`);
    }

    // Resolve whether requisitionId is a Mongo ObjectId or a business requisitionId (e.g. "REQ-2025")
    let targetId = requisitionId;
    if (!mongoose.isValidObjectId(requisitionId)) {
      const found = await this.jobRequisitionRepository.findOne({ requisitionId: requisitionId });
      if (!found) {
        throw new NotFoundException(`Job requisition with requisitionId ${requisitionId} not found`);
      }
      targetId = found._id.toString();
    }

    const requisition = await this.jobRequisitionRepository.updateById(
      targetId,
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
    return this.jobRequisitionRepository.findPublishedWithTemplate();
  }

  // Get all job requisitions (for HR Manager)
  async getAllJobRequisitions(): Promise<JobRequisitionDocument[]> {
    return this.jobRequisitionRepository.findAllWithTemplate();
  }
  // REC-007: Create CV Document
  //REC-007: Create CV Document
  async createCVDocument(createCVDocumentDto: CreateCVDocumentDto, file?: any): Promise<DocumentDocument> {
    const isCandidateValid = await this.validateCandidateExistence(createCVDocumentDto.ownerId);
    if (!isCandidateValid) {
      throw new NotFoundException(`Candidate with id ${createCVDocumentDto.ownerId} is not valid or not active`);
    }
    if (createCVDocumentDto.type != 'cv') {
      throw new NotFoundException(`Document type must be 'cv'`);
    }

    let filePath = createCVDocumentDto.filePath;
    if (file) {
      // Try to get candidate number for cleaner filename, fallback to ID
      let filePrefix = createCVDocumentDto.ownerId;
      try {
        const candidate = await this.candidateRepository.findById(createCVDocumentDto.ownerId);
        if (candidate && candidate.candidateNumber) {
          filePrefix = candidate.candidateNumber;
        }
      } catch (e) {
        console.warn('Could not fetch candidate for file naming', e);
      }

      filePath = this.saveUploadedFile(file, filePrefix);
    }

    const documentData = {
      ...createCVDocumentDto,
      filePath: filePath,
      ownerId: createCVDocumentDto.ownerId ? new Types.ObjectId(createCVDocumentDto.ownerId) : undefined,
      uploadedAt: createCVDocumentDto.uploadedAt || new Date()
    };
    return await this.documentRepository.create(documentData);
  }

  //REC-007: Create Application
  async createApplication(createApplicationDto: CreateApplicationDto, candidateId?: string): Promise<ApplicationDocument> {
    // Find the requisition by user-defined requisitionId
    const requisition = await this.jobRequisitionRepository.findOne({ requisitionId: createApplicationDto.requisitionId });
    if (!requisition) {
      throw new NotFoundException(`Job requisition with id ${createApplicationDto.requisitionId} not found`);
    }

    // Check if requisition has expired
    if (requisition.expiryDate && new Date(requisition.expiryDate) < new Date()) {
      throw new BadRequestException(`Job requisition ${createApplicationDto.requisitionId} has expired and is no longer accepting applications`);
    }

    const validCandidateId = candidateId;
    if (!validCandidateId) {
      throw new BadRequestException('Candidate ID is required');
    }

    const isCandidateValid = await this.validateCandidateExistence(validCandidateId);
    if (!isCandidateValid) {
      throw new NotFoundException(`Candidate with id ${validCandidateId} is not valid or not active`);
    }
    // Check if application already exists for this candidate and requisition
    const existingApplication = await this.applicationRepository.findOne({
      candidateId: new Types.ObjectId(validCandidateId),
      requisitionId: requisition._id
    });

    if (existingApplication) {
      throw new BadRequestException(`Application already exists for candidate ${validCandidateId} and requisition ${createApplicationDto.requisitionId}`);
      // Duplicate line removal
    }

    const applicationData = {
      candidateId: new Types.ObjectId(validCandidateId),
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
    // Still need to populate for single lookup if not in base repo
    return await application.populate([
      { path: 'candidateId' },
      {
        path: 'requisitionId',
        populate: { path: 'templateId' }
      }
    ]) as ApplicationDocument;
  }
  //REC-017 part 1 also need to add validation for it being hr or candidate
  async getallcandidateApplications(candidateId: string): Promise<ApplicationDocument[]> {
    if (!await this.validateCandidateExistence(candidateId)) {
      throw new NotFoundException(`Candidate with id ${candidateId} is not valid or not active`);
    }
    return this.applicationRepository.findByCandidateId(candidateId);
  }

  // Get all applications with populated candidate data
  async getAllApplications(): Promise<ApplicationDocument[]> {
    return this.applicationRepository.findAllPopulated();
  }

  // Get applications by requisition ID
  async getApplicationsByRequisition(requisitionId: string): Promise<ApplicationDocument[]> {
    return this.applicationRepository.findByRequisitionId(requisitionId);
  }

  // Get application history with time-to-hire calculation
  async getApplicationHistory(applicationId: string): Promise<any> {
    const history = await this.applicationHistoryRepository.findByApplicationId(applicationId);
    const application = await this.applicationRepository.findById(applicationId);

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Calculate time-to-hire (from submission to hired/offer accepted)
    let timeToHire: number | null = null;
    if (application.status === 'hired' || application.status === 'offer') {
      const createdAt = (application as any).createdAt || new Date();
      const hiredDate = history.find(h => h.newStatus === 'hired' || h.newStatus === 'offer');
      if (hiredDate && (hiredDate as any).createdAt) {
        const diffInMs = new Date((hiredDate as any).createdAt).getTime() - new Date(createdAt).getTime();
        timeToHire = Math.floor(diffInMs / (1000 * 60 * 60 * 24)); // Convert to days
      }
    }

    return {
      application,
      history,
      timeToHire,
    };
  }

  // REC-017 part2 & REC-022: Update Application Status/Stage by candidateId and requisitionId
  async updateApplication(applicationId: string, updateApplicationDto: UpdateApplicationDto, hrId: string): Promise<ApplicationDocument> {
    //Validate HR exists and has proper role
    /*const isValidHR = await this.validateEmployeeExistence(hrId, [SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE]);
    if (!isValidHR) {
      throw new NotFoundException(`HR with id ${hrId} is not valid or not active`);
    }*/

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
    if (application.status === ApplicationStatus.REJECTED || application.status === ApplicationStatus.HIRED) {
      throw new BadRequestException(`Cannot schedule interview for application with status ${application.status}`);
    }

    // Check if interview already exists for this application
    const existingInterviews = await this.interviewRepository.findByApplicationId(createInterviewDto.applicationId);
    const hasScheduledInterview = existingInterviews.some(
      interview => interview.status === InterviewStatus.SCHEDULED
    );
    if (hasScheduledInterview) {
      throw new BadRequestException(`An interview is already scheduled for this application. Please cancel or complete the existing interview before scheduling a new one.`);
    }

    // Use userId as hrId if provided
    // userId is passed but not currently used in interview creation as 'hrId' is not stored in schema
    // const hrId = userId || createInterviewDto['hrId'];

    /* if (!await this.validateEmployeeExistence(hrId, [SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE])) {
      throw new NotFoundException(`HR with id ${hrId} not found or does not have the required role`);
    }*/
    if (!createInterviewDto.panel || createInterviewDto.panel.length === 0) {
      throw new BadRequestException('At least one interviewer/panel member is required to schedule an interview');
    }
    // Normalize scheduledDate to a Date object (DTO now accepts ISO string)

    if (createInterviewDto.scheduledDate <= new Date()) {
      throw new BadRequestException('Scheduled date and time for the interview must be in the future');
    }
    if (createInterviewDto.method === InterviewMethod.VIDEO && !createInterviewDto.videoLink) {
      throw new BadRequestException('Video link is required for video interviews');
    }
    if (createInterviewDto.method !== InterviewMethod.VIDEO && createInterviewDto.videoLink) {
      throw new BadRequestException('Video link should not be provided for non-video interviews');
    }
    if (new Set(createInterviewDto.panel).size !== createInterviewDto.panel.length) {
      throw new BadRequestException('Duplicate panel member IDs are not allowed');
    }
    // Validate stage is interview-related
    if (createInterviewDto.stage !== ApplicationStage.HR_INTERVIEW &&
      createInterviewDto.stage !== ApplicationStage.DEPARTMENT_INTERVIEW) {
      throw new BadRequestException('Interview can only be created for HR or Department interview stages');
    }
    if (application.currentStage !== ApplicationStage.HR_INTERVIEW &&
      application.currentStage !== ApplicationStage.DEPARTMENT_INTERVIEW) {
      throw new BadRequestException('Interview can only be created for HR or Department interview stages');
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

    // Auto-create assessment for first panel member with score=0 (not submitted)
    if (createInterviewDto.panel.length > 0) {
      const firstPanelMemberId = createInterviewDto.panel[0];
      const assessmentData = {
        interviewId: savedInterview._id,
        interviewerId: new Types.ObjectId(firstPanelMemberId),
        score: 0, // 0 indicates not submitted yet
        comments: ''
      };
      await this.assessmentResultRepository.create(assessmentData);

      // Send notification to first panel member about pending assessment
      await this.sendInterviewNotification(savedInterview, application, 'scheduled');

      // Resolve limited candidate info for notification (only the fields requested)
      const candidateInfo: {
        candidateNumber?: string;
        mobilePhone?: string;
        personalEmail?: string;
        firstName?: string;
        lastName?: string;
      } = {};

      // application.candidateId may be a populated Candidate document or an ObjectId.
      // Prefer populated data; if not populated, fetch candidate by id.
      try {
        let candidateObj: any = null;

        candidateObj = application.candidateId as any;


        if (candidateObj) {
          candidateInfo.candidateNumber = candidateObj.candidateNumber || candidateObj.candidateId || undefined;
          candidateInfo.mobilePhone = candidateObj.mobilePhone || candidateObj.personalMobile || undefined;
          candidateInfo.personalEmail = candidateObj.personalEmail || candidateObj.email || undefined;
          candidateInfo.firstName = candidateObj.firstName || undefined;
          candidateInfo.lastName = candidateObj.lastName || undefined;
        }
      } catch (err) {
        console.error('Failed resolving candidate for panel notification:', err);
      }

      console.log('Candidate Info for Notification:', candidateInfo);

      const panelNotifParts = [] as string[];
      panelNotifParts.push(`Candidate Number: ${candidateInfo.candidateNumber || 'N/A'}`);
      panelNotifParts.push(`Name: ${candidateInfo.firstName || ''} ${candidateInfo.lastName || ''}`.trim());
      panelNotifParts.push(`Email: ${candidateInfo.personalEmail || 'N/A'}`);
      panelNotifParts.push(`Mobile: ${candidateInfo.mobilePhone || 'N/A'}`);

      await this.notificationService.create({
        recipientId: [firstPanelMemberId],
        type: 'Info',
        deliveryType: 'MULTICAST',
        title: 'Assessment Pending',
        message: `You have been assigned to assess an interview for the following candidate:\n\n${panelNotifParts.join('\n')}\n\nPlease submit your feedback after the interview.`,
        relatedEntityId: savedInterview._id.toString(),
        relatedModule: 'Recruitment',
        isRead: false,
      });
    }

    // Send detailed notifications to candidate and panel members
    await this.sendDetailedInterviewNotifications(savedInterview, application, createInterviewDto.panel);

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
      /*const isValidHR = await this.validateEmployeeExistence(updateInterviewDto.hrId, [SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE]);
      if (!isValidHR) {
        throw new NotFoundException(`HR with id ${updateInterviewDto.hrId} is not valid or not active`);
      }*/
    }

    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) {
      throw new NotFoundException(`Interview with id ${interviewId} not found`);
    }

    // Prepare update data
    const updateData: any = {};
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
   * Send detailed interview notifications to candidate and panel members with method-specific info
   */
  private async sendDetailedInterviewNotifications(
    interview: InterviewDocument,
    application: ApplicationDocument,
    panelIds: string[]
  ): Promise<void> {
    const scheduledDate = new Date(interview.scheduledDate);
    const dateStr = scheduledDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const stageLabel = interview.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Get first panel member details for phone interviews
    let firstPanelMemberPhone = '';
    let firstPanelMemberName = '';
    if (interview.method === InterviewMethod.PHONE && panelIds.length > 0) {
      try {
        const firstPanelMember = await this.employeeService.findById(panelIds[0]);
        if (firstPanelMember) {
          firstPanelMemberPhone = (firstPanelMember as any).mobilePhone || (firstPanelMember as any).homePhone || 'N/A';
          firstPanelMemberName = `${(firstPanelMember as any).firstName || ''} ${(firstPanelMember as any).lastName || ''}`.trim();
        }
      } catch (error) {
        console.error('Failed to fetch panel member details:', error);
      }
    }

    // Send notification to candidate
    let candidateMessage = `Your ${stageLabel} interview has been scheduled for ${dateStr} at ${timeStr}.\n\n`;
    candidateMessage += `Interview Method: ${interview.method.toUpperCase()}\n`;

    if (interview.method === InterviewMethod.VIDEO && interview.videoLink) {
      candidateMessage += `\nVideo Link: ${interview.videoLink}\n\nPlease ensure you have a stable internet connection and join the meeting 5 minutes early.`;
    } else if (interview.method === InterviewMethod.PHONE && firstPanelMemberPhone) {
      candidateMessage += `\nYou will be contacted at your registered phone number by ${firstPanelMemberName || 'the interviewer'}.\nInterviewer Contact: ${firstPanelMemberPhone}\n\nPlease ensure your phone is accessible at the scheduled time.`;
    } else if (interview.method === InterviewMethod.ONSITE) {
      candidateMessage += `\nPlease arrive at the office location 15 minutes before the scheduled time. Bring a valid ID and any required documents.`;
    }

    try {
      // Resolve candidate id whether populated or plain id
      let candidateIdStr = '';
      if (!application.candidateId) {
        console.error('Application has no candidateId:', application._id?.toString());
      } else if (typeof application.candidateId === 'string') {
        candidateIdStr = application.candidateId;
      } else if ((application.candidateId as any)._id) {
        candidateIdStr = (application.candidateId as any)._id.toString();
      } else if (application.candidateId.toString) {
        // fallback: try toString (may result in [object Object] so validate length)
        const s = application.candidateId.toString();
        if (/^[a-fA-F0-9]{24}$/.test(s)) candidateIdStr = s;
      }

      if (!candidateIdStr) {
        console.error('Unable to resolve candidate id for notification, skipping candidate notify for interview', interview._id?.toString());
      } else {
        await this.notificationService.create({
          recipientId: [candidateIdStr],
          type: 'Info',
          deliveryType: 'MULTICAST',
          title: `${stageLabel} Interview Scheduled`,
          message: candidateMessage,
          relatedEntityId: interview._id.toString(),
          relatedModule: 'Recruitment',
          isRead: false,
        });
      }
    } catch (error) {
      console.error('Failed to send candidate notification:', error);
    }

    // Send notifications to all panel members
    if (panelIds && panelIds.length > 0) {
      let panelMessage = `You have been assigned to conduct a ${stageLabel} on ${dateStr} at ${timeStr}.\n\n`;
      panelMessage += `Interview Method: ${interview.method.toUpperCase()}\n`;

      if (interview.method === InterviewMethod.VIDEO && interview.videoLink) {
        panelMessage += `\nVideo Link: ${interview.videoLink}\n\nPlease join the meeting 5 minutes early.`;
      } else if (interview.method === InterviewMethod.PHONE) {
        panelMessage += `\nPlease call the candidate at their registered phone number at the scheduled time.`;
      } else if (interview.method === InterviewMethod.ONSITE) {
        panelMessage += `\nThe interview will be conducted at the office. Please be present in the designated interview room.`;
      }

      try {
        await this.notificationService.create({
          recipientId: panelIds,
          type: 'Info',
          deliveryType: 'MULTICAST',
          title: `${stageLabel} Assigned`,
          message: panelMessage,
          relatedEntityId: interview._id.toString(),
          relatedModule: 'Recruitment',
          isRead: false,
        });
      } catch (error) {
        console.error('Failed to send panel member notifications:', error);
      }
    }
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
      case 'completed':
      case InterviewStatus.COMPLETED:
        title = 'Interview Completed';
        message = `Your ${interview.stage.replace('_', ' ')} interview has been completed. You will be notified of the next steps soon.`;
        notificationType = 'Success';
        break;
      case 'cancelled':
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
  async createReferral(candidateId: string, createReferralDto: CreateReferralDto, userId?: string): Promise<ReferralDocument> {

    const referringEmployeeId = userId || createReferralDto.referringEmployeeId;

    /* const isEmployeeValid = await this.validateEmployeeExistence(referringEmployeeId, [SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN]);
     if (!isEmployeeValid) {
       throw new NotFoundException(`Employee with id ${referringEmployeeId} is not valid or not active`);
     }*/
    if (!await this.validateCandidateExistence(candidateId)) {
      throw new NotFoundException(`Candidate with id ${candidateId} is not valid or not active`);
    }

    // Check if a referral already exists for this candidate (prevent duplicates per candidate)
    const existingReferrals = await this.referralRepository.findByCandidateId(candidateId);
    if (existingReferrals && existingReferrals.length > 0) {
      throw new BadRequestException(`A referral already exists for this candidate. Candidates can only be referred once.`);
    }

    const referralData = {
      candidateId: new Types.ObjectId(candidateId),
      referringEmployeeId: new Types.ObjectId(referringEmployeeId),
      role: createReferralDto.role,
      level: createReferralDto.level,
    };
    return await this.referralRepository.create(referralData);
  }

  // Get all referrals
  async getAllReferrals(): Promise<ReferralDocument[]> {
    return await this.referralRepository.find();
  }

  // Get all offers
  async getAllOffers(): Promise<OfferDocument[]> {
    return await this.offerRepository.find();
  }

  // Get offer by ID with manually populated data to avoid schema issues and fix 500 errors
  async getOfferById(offerId: string): Promise<any> {
    const offer = await this.offerRepository.findById(offerId);
    if (!offer) {
      throw new NotFoundException(`Offer with id ${offerId} not found`);
    }

    const offerObj = offer.toObject() as any;

    // Manually populate candidate to ensure data availability and handle email mapping
    if (offer.candidateId) {
      try {
        const candidate = await this.candidateRepository.findById(offer.candidateId.toString());
        if (candidate) {
          offerObj.candidateId = {
            ...candidate.toObject(),
            _id: candidate._id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            // Map personalEmail to email as frontend expects 'email'
            email: candidate.personalEmail || (candidate as any).email || 'N/A'
          };
        }
      } catch (e) {
        console.warn('Failed to manually populate candidate for offer', e);
      }
    }

    // Populate application details with requisition and job template
    if (offer.applicationId) {
      try {
        const application = await this.applicationRepository.findById(offer.applicationId.toString());
        if (application) {
          const appObj = application.toObject ? application.toObject() : application;

          // Populate requisition details
          if (appObj.requisitionId) {
            const requisition = await this.jobRequisitionRepository.findById(appObj.requisitionId.toString());
            if (requisition) {
              const reqObj = requisition.toObject ? requisition.toObject() : requisition;

              // Populate job template details
              if (reqObj.templateId) {
                const template = await this.jobTemplateRepository.findById(reqObj.templateId.toString());
                if (template) {
                  const templateObj = template.toObject ? template.toObject() : template;

                  // Build job details object without MongoDB IDs
                  offerObj.jobDetails = {
                    requisitionId: reqObj.requisitionId, // Custom ID, not MongoDB _id
                    location: reqObj.location,
                    openings: reqObj.openings,
                    department: templateObj.department,
                    title: templateObj.title,
                    description: templateObj.description,
                    qualifications: templateObj.qualifications || [],
                    skills: templateObj.skills || []
                  };
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to populate application/requisition/template details for offer', e);
      }
    }

    // Manually populate approvers
    if (offerObj.approvers && offerObj.approvers.length > 0) {
      for (const approver of offerObj.approvers) {
        if (approver.employeeId) {
          try {
            const employee = await this.employeeService.findById(approver.employeeId.toString());
            if (employee) {
              // Handle mongoose document or plain object
              const empObj = (employee as any).toObject ? (employee as any).toObject() : employee;

              // Debug logging
              console.log('Employee object for approver:', {
                id: empObj._id,
                workEmail: empObj.workEmail,
                personalEmail: empObj.personalEmail,
                firstName: empObj.firstName,
                lastName: empObj.lastName
              });

              // Flatten details for frontend convenience
              // Handle empty strings by using || operator which treats '' as falsy
              const email = empObj.workEmail || empObj.personalEmail || 'N/A';
              approver.email = email;
              approver.firstName = empObj.firstName || 'Unknown';
              approver.lastName = empObj.lastName || 'User';
              approver.name = `${empObj.firstName || 'Unknown'} ${empObj.lastName || 'User'}`;
              // Also point employeeId to the object for reference
              approver.employeeId = empObj;
            }
          } catch (e) {
            console.warn(`Failed to populate approver ${approver.employeeId}`, e);
          }
        }
      }
    }

    // Compute benifitsum for this single offer (use config service, fallback to offer-local values)
    try {
      let benifitsum = 0;
      if (offerObj.benefits && Array.isArray(offerObj.benefits) && offerObj.benefits.length > 0) {
        try {
          benifitsum = await this.configSetupService.terminationBenefit.sumApprovedBenefits(offerObj.benefits);
        } catch (e) {
          console.warn('Failed to compute approved benefit sum for offer in getOfferById', e);
        }

        // Fallback: if no approved configs matched, attempt to sum numeric/amounts present directly on the offer
        if (!benifitsum) {
          benifitsum = (offerObj.benefits || []).reduce((acc: number, b: any) => {
            if (typeof b === 'number') return acc + b;
            if (b && typeof b === 'object') {
              const v = b.amount ?? b.value ?? b.amountValue ?? 0;
              return acc + (typeof v === 'number' ? v : 0);
            }
            return acc;
          }, 0);
        }
      }

      offerObj.benifitsum = benifitsum;
      offerObj.offerDocument = offerObj.content || '';
    } catch (e) {
      console.warn('Error while attaching benifitsum to offer', e);
      offerObj.benifitsum = 0;
      offerObj.offerDocument = offerObj.content || '';
    }

    return offerObj;
  }

  // Get offers by candidate ID
  async getOffersByCandidateId(candidateId: string): Promise<any[]> {
    // Get offers that have been sent to the candidate
    const offers = await this.offerRepository.find({
      candidateId: new mongoose.Types.ObjectId(candidateId),
      finalStatus: 'sent'
    })

    // Calculate benifitsum for each offer using terminationBenefitService
    const offersWithBenefits = await Promise.all(
      offers.map(async (offer) => {
        const offerObj = offer.toObject ? offer.toObject() : offer;
        let benifitsum = 0;

        if (offerObj.benefits && Array.isArray(offerObj.benefits) && offerObj.benefits.length > 0) {
          try {
            benifitsum = await this.configSetupService.terminationBenefit.sumApprovedBenefits(offerObj.benefits);
          } catch (error) {
            console.warn('Failed to calculate benefit sum for offer', error);
          }

          // Fallback: if no approved configs matched, attempt to sum numeric/amounts present directly on the offer
          if (!benifitsum) {
            benifitsum = (offerObj.benefits || []).reduce((acc: number, b: any) => {
              if (typeof b === 'number') return acc + b;
              if (b && typeof b === 'object') {
                const v = b.amount ?? b.value ?? b.amountValue ?? 0;
                return acc + (typeof v === 'number' ? v : 0);
              }
              return acc;
            }, 0);
          }
        }

        return {
          ...offerObj,
          benifitsum,
          offerDocument: offerObj.content || '' // Map content to offerDocument for DTO compatibility
        };
      })
    );

    return offersWithBenefits;
  }

  /**
   * Get offers by candidate ID without filtering by finalStatus.
   * Useful for debugging or when candidates should see offers in other states.
   */
  async getAllOffersByCandidateId(candidateId: string): Promise<any[]> {
    const offers = await this.offerRepository.find({
      candidateId: new mongoose.Types.ObjectId(candidateId),
    });

    const offersWithBenefits = await Promise.all(
      offers.map(async (offer) => {
        const offerObj = offer.toObject ? offer.toObject() : offer;
        let benifitsum = 0;

        if (offerObj.benefits && Array.isArray(offerObj.benefits) && offerObj.benefits.length > 0) {
          try {
            benifitsum = await this.configSetupService.terminationBenefit.sumApprovedBenefits(offerObj.benefits);
          } catch (error) {
            console.warn('Failed to calculate benefit sum for offer', error);
          }

          if (!benifitsum) {
            benifitsum = (offerObj.benefits || []).reduce((acc: number, b: any) => {
              if (typeof b === 'number') return acc + b;
              if (b && typeof b === 'object') {
                const v = b.amount ?? b.value ?? b.amountValue ?? 0;
                return acc + (typeof v === 'number' ? v : 0);
              }
              return acc;
            }, 0);
          }
        }

        return {
          ...offerObj,
          benifitsum,
          offerDocument: offerObj.content || ''
        };
      })
    );

    return offersWithBenefits;
  }

  // Get all contracts
  async getAllContracts(): Promise<any[]> {
    const contracts = await this.contractRepository.findAllWithOffer();

    return await Promise.all(contracts.map(async (contract) => {
      const contractObj = contract.toObject ? contract.toObject() : contract;

      // If offerId is populated and has a candidateId, ensure candidate details are present
      if (contractObj.offerId && (contractObj.offerId as any).candidateId) {
        const candidateId = (contractObj.offerId as any).candidateId;

        // If candidateId is just an ID (string/ObjectId), fetch the candidate details manually
        if (typeof candidateId === 'string' || mongoose.Types.ObjectId.isValid(candidateId)) {
          try {
            const candidate = await this.candidateRepository.findById(candidateId.toString());
            if (candidate) {
              const candidateObj = candidate.toObject ? candidate.toObject() : candidate;
              (contractObj.offerId as any).candidateId = {
                _id: candidateObj._id,
                firstName: candidateObj.firstName,
                lastName: candidateObj.lastName,
                fullName: candidateObj.fullName,
                candidateNumber: candidateObj.candidateNumber
              };
            }
          } catch (e) {
            console.warn(`Failed to manually populate candidate ${candidateId} for contract ${contractObj._id}`, e);
          }
        }
      }

      return contractObj;
    }));
  }

  // Get contracts by candidate ID
  async getContractsByCandidateId(candidateId: string): Promise<any[]> {
    // First, find all offers for this candidate
    const offers = await this.offerRepository.find({ candidateId: new mongoose.Types.ObjectId(candidateId) });

    if (!offers || offers.length === 0) {
      return [];
    }

    // Extract offer IDs
    const offerIds = offers.map(offer => offer._id);

    // Find all contracts that reference these offers
    const contracts = await this.contractRepository.findByOfferIds(offerIds as any[]);

    // Manually add candidate details to each contract's offer
    return await Promise.all(contracts.map(async (contract) => {
      const contractObj = contract.toObject ? contract.toObject() : contract;

      // Populate offerId if it's just an ID
      if (contractObj.offerId && (typeof contractObj.offerId === 'string' || mongoose.Types.ObjectId.isValid(contractObj.offerId as any))) {
        try {
          const offer = await this.offerRepository.findById(contractObj.offerId.toString());
          if (offer) {
            (contractObj as any).offerId = offer.toObject ? offer.toObject() : offer;
          }
        } catch (e) {
          console.warn(`Failed to populate offer details for contract ${contractObj._id}`, e);
        }
      }

      if (contractObj.offerId && (contractObj.offerId as any).candidateId) {
        try {
          // Since we know the candidateId (it's what we searched by), we can use it or fetch full details
          const candidate = await this.candidateRepository.findById(candidateId);
          if (candidate) {
            const candidateObj = candidate.toObject ? candidate.toObject() : candidate;
            (contractObj.offerId as any).candidateId = {
              _id: candidateObj._id,
              firstName: candidateObj.firstName,
              lastName: candidateObj.lastName,
              fullName: candidateObj.fullName,
              candidateNumber: candidateObj.candidateNumber
            };
          }
        } catch (e) {
          console.warn(`Failed to populate candidate details for contract ${contractObj._id}`, e);
        }
      }

      return contractObj;
    }));
  }

  // Get offers where I am an approver
  async getMyApprovals(employeeId: string): Promise<any[]> {
    const offers = await this.offerRepository.find({
      'approvers.employeeId': new mongoose.Types.ObjectId(employeeId)
    });

    // Populate candidate and approver details manually
    return await Promise.all(offers.map(async (offer) => {
      const offerObj = offer.toObject() as any;

      // Populate Candidate
      if (offer.candidateId) {
        try {
          const candidate = await this.candidateRepository.findById(offer.candidateId.toString());
          if (candidate) {
            offerObj.candidateId = {
              ...candidate.toObject(),
              firstName: candidate.firstName,
              lastName: candidate.lastName,
              email: candidate.personalEmail || (candidate as any).email || 'N/A'
            };

            // Get candidate's CV documents
            try {
              const cvDocuments = await this.documentRepository.findByOwnerId(offer.candidateId.toString());
              offerObj.cvDocuments = cvDocuments.filter((doc: any) => {
                const docObj = doc.toObject ? doc.toObject() : doc;
                return docObj.type === 'cv' || docObj.type === 'resume';
              });
            } catch (e) {
              console.warn('Failed to fetch CV documents', e);
              offerObj.cvDocuments = [];
            }
          }
        } catch (e) { console.warn('Failed to populate candidate', e); }
      }

      // Populate Approvers
      if (offerObj.approvers) {
        for (const approver of offerObj.approvers) {
          if (approver.employeeId) {
            try {
              const employee = await this.employeeService.findById(approver.employeeId.toString());
              if (employee) {
                const empObj = (employee as any).toObject ? (employee as any).toObject() : employee;
                // Handle empty strings by using || operator which treats '' as falsy
                const email = empObj.workEmail || empObj.personalEmail || 'N/A';
                approver.email = email;
                approver.firstName = empObj.firstName || 'Unknown';
                approver.lastName = empObj.lastName || 'User';
                approver.name = `${empObj.firstName || 'Unknown'} ${empObj.lastName || 'User'}`;
                approver.employeeId = empObj;
              }
            } catch (e) { }
          }
        }
      }

      // Calculate benefit sum for termination benefits
      try {
        let benifitsum = 0;
        if (offerObj.benefits && Array.isArray(offerObj.benefits) && offerObj.benefits.length > 0) {
          try {
            benifitsum = await this.configSetupService.terminationBenefit.sumApprovedBenefits(offerObj.benefits);
          } catch (e) {
            console.warn('Failed to calculate benefit sum for offer', e);
          }

          // Fallback: if no approved configs matched, attempt to sum numeric/amounts present directly on the offer
          if (!benifitsum) {
            benifitsum = (offerObj.benefits || []).reduce((acc: number, b: any) => {
              if (typeof b === 'number') return acc + b;
              if (b && typeof b === 'object') {
                const v = b.amount ?? b.value ?? b.amountValue ?? 0;
                return acc + (typeof v === 'number' ? v : 0);
              }
              return acc;
            }, 0);
          }
        }
        offerObj.benifitsum = benifitsum;
      } catch (e) {
        console.warn('Error calculating benefit sum', e);
        offerObj.benifitsum = 0;
      }

      return offerObj;
    }));
  }

  async submitAssessment(assessmentId: string, createAssessmentDto: CreateAssessmentDto, interviewerId: string): Promise<AssessmentResultDocument> {
    const { score, comments } = createAssessmentDto;

    // Validate assessment exists
    const assessment = await this.assessmentResultRepository.findById(assessmentId);
    if (!assessment) {
      throw new NotFoundException(`Assessment with id ${assessmentId} not found`);
    }

    // Validate interviewer is the assigned interviewer
    if (assessment.interviewerId.toString() !== interviewerId) {
      throw new BadRequestException('You are not authorized to submit this assessment');
    }

    // Check if already submitted (score > 0)
    if (assessment.score > 0) {
      throw new BadRequestException('Assessment has already been submitted and cannot be modified');
    }

    // Validate score range
    if (score < 1 || score > 10) {
      throw new BadRequestException('Score must be between 1 and 10');
    }

    // Update the assessment
    const updatedAssessment = await this.assessmentResultRepository.updateById(assessmentId, {
      score,
      comments
    });

    if (!updatedAssessment) {
      throw new NotFoundException(`Failed to update assessment`);
    }

    // Get interview and application for notifications
    const interview = await this.interviewRepository.findById(assessment.interviewId.toString());
    if (interview) {
      await this.interviewRepository.updateById(interview._id.toString(), { feedbackId: updatedAssessment._id });

      const application = await this.applicationRepository.findById(interview.applicationId.toString());

      // Send notification to HR about the assessment
      await this.notificationService.create({
        recipientId: [],
        type: 'Info',
        deliveryType: 'MULTICAST',
        deliverToRole: SystemRole.HR_MANAGER,
        title: 'Assessment Submitted',
        message: `Assessment has been submitted for interview. Score: ${score}/10`,
        relatedEntityId: interview._id.toString(),
        relatedModule: 'Recruitment',
        isRead: false,
      });

      // Send notification to candidate
      if (application) {
        await this.notificationService.create({
          recipientId: [application.candidateId.toString()],
          type: 'Info',
          deliveryType: 'MULTICAST',
          title: 'Interview Assessment Completed',
          message: `Your interview has been assessed. You will be notified of the next steps soon.`,
          relatedEntityId: interview._id.toString(),
          relatedModule: 'Recruitment',
          isRead: false,
        });
      }
    }

    return updatedAssessment;
  }

  async getMyAssessments(interviewerId: string): Promise<AssessmentResultDocument[]> {
    return await this.assessmentResultRepository.find({
      interviewerId: new Types.ObjectId(interviewerId)
    });
  }

  async getAllAssessments(): Promise<AssessmentResultDocument[]> {
    return await this.assessmentResultRepository.find({});
  }
  async getAssessmentsByInterviewId(interviewId: string): Promise<AssessmentResultDocument[]> {
    return await this.assessmentResultRepository.findByInterviewId(interviewId);
  }
}