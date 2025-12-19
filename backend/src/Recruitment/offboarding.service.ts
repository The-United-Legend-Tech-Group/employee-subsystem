import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  TerminationRequestRepository,
  ClearanceChecklistRepository,
  // EmployeeTerminationResignationRepository,
  ContractRepository
} from './repositories';
import { CandidateRepository } from '../employee-subsystem/employee/repository/candidate.repository';
import { OfferRepository } from './repositories/implementations/offer.repository';
import { OfferResponseStatus } from './enums/offer-response-status.enum';
import { InitiateTerminationReviewDto } from './offboardingDtos/initiate-termination-review.dto';
import { InitiateOffboardingChecklistDto } from './offboardingDtos/initiate-offboarding-checklist.dto';
//import { SendOffboardingNotificationDto } from './offboardingDtos/send-offboarding-notification.dto';
import { SubmitResignationDto } from './offboardingDtos/submit-resignation.dto';
import { TrackResignationStatusDto } from './offboardingDtos/track-resignation-status.dto';
import { RevokeSystemAccessDto } from './offboardingDtos/revoke-system-access.dto';
import { DepartmentClearanceSignOffDto } from './offboardingDtos/department-clearance-signoff.dto';
//import { Notification } from '../employee-subsystem/notification/models/notification.schema';
import { ApproveTerminationDto } from './offboardingDtos/approve-termination.dto';
import { TerminationStatus } from './enums/termination-status.enum';
import { TerminationInitiation } from './enums/termination-initiation.enum';
import { ApprovalStatus } from './enums/approval-status.enum';
import { TerminationRequest } from './models/termination-request.schema';
import { ClearanceChecklist } from './models/clearance-checklist.schema';
import { EmployeeStatus } from '../employee-subsystem/employee/enums/employee-profile.enums';
import { EmployeeService } from '../employee-subsystem/employee/employee.service';
import { NotificationService } from '../employee-subsystem/notification/notification.service';
import { AppraisalRecordService } from 'src/employee-subsystem/performance/appraisal-record.service';
//import { LeavesRequestService } from 'src/leaves/request/leave-requests.service';
import { UpdateEmployeeStatusDto } from 'src/employee-subsystem/employee/dto/update-employee-status.dto';
import { OrganizationStructureService } from 'src/employee-subsystem/organization-structure/organization-structure.service';
import { EmployeeTerminationResignationService } from '../payroll/execution/services/EmployeeTerminationResignation.service';
@Injectable()
export class OffboardingService {
  constructor(
    private readonly terminationRequestRepository: TerminationRequestRepository,
    private readonly contractRepository: ContractRepository,
    private readonly clearanceChecklistRepository: ClearanceChecklistRepository,
    //   private readonly employeeTerminationResignationRepository: EmployeeTerminationResignationRepository,
    private employeeService: EmployeeService,
    @Inject(forwardRef(() => AppraisalRecordService))
    private appraisalrecordservice: AppraisalRecordService,
    //private leavesRequestService: LeavesRequestService, check this later on again
    private notificationService: NotificationService,
    private organizationStructureService: OrganizationStructureService,
    private employeeTerminationService: EmployeeTerminationResignationService,
    private readonly candidateRepository: CandidateRepository,
    private readonly offerRepository: OfferRepository,
  ) { }


  //OFF-001 
  // (As an HR Manager, initiating termination reviews based on warnings and performance data / manager requests, so that exits are justified.)

  async initiateTerminationReview(dto: InitiateTerminationReviewDto,
  ): Promise<TerminationRequest> {
    console.log(`Initiating termination review for employee ${dto.employeeNumber} by ${dto.initiator}`
    );

    // Step 1: Get employee by employee number
    const employee = await this.employeeService.findByEmployeeNumber(dto.employeeNumber);

    if (!employee) {
      console.error(`Employee with number ${dto.employeeNumber} not found`);
      throw new NotFoundException(`Employee with number ${dto.employeeNumber} not found`);
    }
    // Type-safe runtime normalization (handles missing _id in the TS type)
    const rawId = (employee as any)?._id ?? (employee as any)?.id;
    if (!rawId) {
      console.error(`Employee record for ${dto.employeeNumber} has no id`);
      throw new NotFoundException(`Employee record for ${dto.employeeNumber} missing id`);
    }
    const employeeObjectId = rawId instanceof Types.ObjectId ? rawId : new Types.ObjectId(String(rawId));
    const employeeId = employeeObjectId.toString();

    // Ensure employee number resolved to an ID — otherwise it's invalid
    // Also prevent duplicate termination requests for the same employee (any status)
    const existingTerminations = await this.terminationRequestRepository.findByEmployeeId(employeeId);
    if (existingTerminations && existingTerminations.length > 0) {
      const ids = existingTerminations.map(t => String(t._id)).join(', ');
      console.warn(`Employee ${dto.employeeNumber} already has existing termination request(s): ${ids}`);
      // throw new BadRequestException(`Cannot initiate termination for employee ${dto.employeeNumber} - existing termination request(s) found: ${ids}`);
      throw new BadRequestException(`Cannot initiate termination for employee ${dto.employeeNumber} as existing termination request was found `);
    }

    // Check if employee has existing active termination request (legacy check preserved for clarity)
    const existingTerminationRequest = await this.terminationRequestRepository
      .findActiveByEmployeeId(employeeId);

    if (existingTerminationRequest) {
      console.warn(`Employee ${dto.employeeNumber} already has an active termination request`);
      throw new BadRequestException(`Cannot initiate termination for employee ${dto.employeeNumber} - employee already has an active termination request with status ${existingTerminationRequest.status}`);
    }

    // Check if employee is already terminated/revoked
    try {
      const employeeProfile = await this.employeeService.getProfile(employeeId);
      if (employeeProfile && employeeProfile.profile && employeeProfile.profile.status === EmployeeStatus.TERMINATED) {
        console.warn(`Employee ${dto.employeeNumber} is already terminated`);
        throw new BadRequestException(`Cannot initiate termination for employee ${dto.employeeNumber} - employee is already terminated/revoked from the system`);
      }
    } catch (error) {
      // If we can't fetch the profile, the employee might be deleted or revoked
      if (error instanceof BadRequestException) {
        throw error; // Re-throw our own error
      }
      console.error(`Failed to fetch employee profile for ${dto.employeeNumber}:`, error.message);
      throw new BadRequestException(`Cannot initiate termination for employee ${dto.employeeNumber} - employee may be revoked from the system or profile not accessible`);
    }

    // Step 2: Convert employee number to candidate number (EMP -> CAN)
    if (!dto.employeeNumber.startsWith('EMP')) {
      throw new BadRequestException(`Invalid employee number format: ${dto.employeeNumber}. Must start with EMP`);
    }
    const candidateNumber = 'CAN' + dto.employeeNumber.substring(3);
    console.log(`Converted employee number ${dto.employeeNumber} to candidate number: ${candidateNumber}`);

    // Step 3: Find candidate by candidate number
    const candidate = await this.candidateRepository.findByCandidateNumber(candidateNumber);
    if (!candidate) {
      throw new NotFoundException(`Candidate with number ${candidateNumber} not found`);
    }
    console.log(`Found candidate with ID: ${candidate._id}`);

    // Step 4: Find contract where employeeSignatureUrl contains the candidate number
    const allContracts = await this.contractRepository.find({});
    const contract = allContracts.find((c: any) =>
      c.employeeSignatureUrl && c.employeeSignatureUrl.includes(candidateNumber)
    );

    if (!contract) {
      throw new NotFoundException(`No contract found with employeeSignatureUrl containing ${candidateNumber}`);
    }

    const contractObjectId = new Types.ObjectId(contract._id);
    console.log(`Found contract ${contract._id} with employeeSignatureUrl: ${contract.employeeSignatureUrl}`);

    // Try to get appraisal records for the employee (optional)
    let appraisalRecords: any[] = [];
    let latestAppraisal: any = null;

    try {
      appraisalRecords = await this.appraisalrecordservice.getFinalizedRecordsForEmployee(employeeId);
      latestAppraisal = appraisalRecords.length > 0 ? appraisalRecords[0] : null;

      if (latestAppraisal) {
        console.log(`Found performance data for employee ${dto.employeeNumber}: Score ${latestAppraisal.totalScore}`);
      } else {
        console.log(`No performance data found for employee ${dto.employeeNumber}`);
      }
    } catch (error) {
      console.log(`Could not fetch appraisal records for employee ${dto.employeeNumber}:`, error.message);
      // Continue without appraisal data - it's optional
    }

    //  TODO: what factors do we consider before making the termiantion request
    //e.g: specific score,specific rating,etc?


    const terminationRequestData = {
      employeeId: employeeObjectId,
      contractId: contractObjectId,
      initiator: dto.initiator,
      reason: dto.reason,
      //TODO: in case the employee didn't write a comment what should be done in this case?
      employeeComments: dto.employeeComments,
      hrComments: dto.hrComments,
      status: TerminationStatus.PENDING,
      terminationDate: dto.terminationDate ? new Date(dto.terminationDate) : undefined,
    };
    const savedTerminationRequest = await this.terminationRequestRepository.create(terminationRequestData);
    console.log(`Termination review initiated successfully for employee ${dto.employeeNumber} with ID ${savedTerminationRequest._id}`);

    // Step 1: Automatically create employee termination/resignation benefits record
    console.log(`Creating termination benefits record for employee ${dto.employeeNumber}...`);
    try {
      // Step 1.1: Get employee profile to extract employee number
      const employeeProfile = await this.employeeService.getProfile(employeeId);
      if (!employeeProfile || !employeeProfile.profile) {
        throw new Error('Employee profile not found');
      }

      const employeeNumber = employeeProfile.profile.employeeNumber;
      console.log(`Employee number: ${employeeNumber}`);

      // Step 1.2: Convert employee number to candidate number (EMP -> CAN)
      if (!employeeNumber || !employeeNumber.startsWith('EMP')) {
        throw new Error(`Invalid employee number format: ${employeeNumber}`);
      }
      const candidateNumber = 'CAN' + employeeNumber.substring(3);
      console.log(`Converted to candidate number: ${candidateNumber}`);

      // Step 1.3: Find candidate by candidate number
      const candidate = await this.candidateRepository.findByCandidateNumber(candidateNumber);
      if (!candidate) {
        throw new Error(`Candidate with number ${candidateNumber} not found`);
      }
      console.log(`Found candidate with ID: ${candidate._id}`);

      // Step 1.4: Find offers for the candidate
      const offers = await this.offerRepository.findByCandidateId(candidate._id.toString());
      if (!offers || offers.length === 0) {
        throw new Error(`No offers found for candidate ${candidateNumber}`);
      }
      console.log(`Found ${offers.length} offer(s) for candidate`);

      // Step 1.5: Find the accepted offer
      const acceptedOffer = offers.find(offer => offer.applicantResponse === OfferResponseStatus.ACCEPTED);
      if (!acceptedOffer) {
        throw new Error(`No accepted offer found for candidate ${candidateNumber}`);
      }
      console.log(`Found accepted offer with ID: ${acceptedOffer._id}`);

      // Step 1.6: Find contract using the accepted offer ID
      const contract = await this.contractRepository.findOne({ offerId: acceptedOffer._id });
      if (!contract) {
        throw new Error(`Contract not found for accepted offer ${acceptedOffer._id}`);
      }
      console.log(`Found contract with ID: ${contract._id}`);
      console.log(`Contract benefits:`, contract.benefits);
      console.log(`Offer benefits:`, acceptedOffer.benefits);

      // Step 1.7: Extract benefits from contract, fallback to offer benefits if contract has none
      let benefits = contract.benefits || [];

      // If contract has no benefits, try to get them from the offer
      if (benefits.length === 0 && acceptedOffer.benefits && acceptedOffer.benefits.length > 0) {
        console.log(`No benefits in contract, using benefits from offer instead`);
        benefits = acceptedOffer.benefits;
      }

      if (benefits.length === 0) {
        throw new Error(`No benefits found in contract or offer for candidate ${candidateNumber}`);
      }
      console.log(`Found ${benefits.length} benefits: ${benefits.join(', ')}`);

      // Step 1.8: Use the benefits as the benefit name (combine if multiple)
      const benefitName = benefits.join(', ');

      console.log(`Using benefit name: ${benefitName}`);

      const terminationBenefitDto = {
        employeeId: employeeId,
        benefitName: benefitName,
        terminationId: savedTerminationRequest._id.toString(),
      };

      const terminationBenefit = await this.employeeTerminationService.createEmployeeTermination(terminationBenefitDto);
      console.log(`✓ Employee termination benefits record created successfully for employee ${dto.employeeNumber}`);
      console.log(`Benefit details:`, terminationBenefit);
    } catch (error) {
      console.error(`✗ Failed to create termination benefits record: ${error.message}`);
      console.error(`This may be due to missing benefit configuration in the database. The termination will proceed, but benefits calculation may need manual review.`);
      // Continue with termination process even if benefit creation fails
      // HR can manually create the benefit record later if needed
    }

    // Step 1: Send notifications to all departments with department head targeting
    const departments = [
      'Health Insurance',
      'Inventory',
      'Library',
      'Post Grad Studies',
      'Finance',
      'IT Equipment',
      'HR'
    ];

    console.log(`Sending termination notifications for employee ${dto.employeeNumber}...`);

    for (const department of departments) {
      try {
        // Try to get department head ID
        const departmentHeadId = await this.getDepartmentHeadId(department);
        
        const recipients = departmentHeadId 
          ? [departmentHeadId.toString()] 
          : [employeeId]; // Fallback to general notification

        console.log(`Sending notification to ${department} department. Recipients:`, recipients);

        const notificationPayload = {
          recipientId: recipients,
          type: 'Alert',
          deliveryType: departmentHeadId ? 'UNICAST' : 'MULTICAST',
          title: `Termination Initiated - ${department} Department Clearance Required`,
          message: `A termination has been initiated for Employee ${dto.employeeNumber}.

Action Required:
An offboarding checklist has been automatically created. Please review and process the clearance items for your department.

Department: ${department}
Employee: ${dto.employeeNumber}
Termination Reason: ${dto.reason}
Status: Pending Review

Please navigate to the Offboarding Clearance section to sign off on your department's items.`,
          relatedModule: 'Recruitment',
          isRead: false,
        };

        await this.notificationService.create(notificationPayload);
        
        console.log(`✓ Notification sent successfully to ${department} department${departmentHeadId ? ' head' : ' (general)'}`);
      } catch (error) {
        console.error(`✗ Failed to send notification to ${department}:`, error.message);
        console.error(`Error details:`, error);
      }
    }

    console.log(`Completed sending ${departments.length} department notifications`);

    // Step 2: Automatically create offboarding checklist with predefined items
    try {
      // Create predefined 11-item checklist with locations and persons in charge (similar to createOnboardingWithDefaults)
      const departmentItems = [
        {
          department: 'Health Insurance',
          status: ApprovalStatus.PENDING,
          comments: 'Location: S 306, Person in charge: Dr. Ahmed Hassan',
          updatedAt: new Date(),
        },
        {
          department: 'Inventory',
          status: ApprovalStatus.PENDING,
          comments: 'Location: S 102, Person in charge: Ms. Sarah Ahmed',
          updatedAt: new Date(),
        },
        {
          department: 'Library',
          status: ApprovalStatus.PENDING,
          comments: 'Location: S 201, Person in charge: Ms. Fatma Ibrahim',
          updatedAt: new Date(),
        },
        {
          department: 'Post Grad Studies',
          status: ApprovalStatus.PENDING,
          comments: 'Location: S 401, Person in charge: Dr. Laila Mostafa',
          updatedAt: new Date(),
        },
        {
          department: 'Finance',
          status: ApprovalStatus.PENDING,
          comments: 'Location: S 203, Person in charge: Mr. Omar Salah',
          updatedAt: new Date(),
        },
        {
          department: 'IT Equipment',
          status: ApprovalStatus.PENDING,
          comments: 'Location: IT Department - S 301, Person in charge: Eng. Youssef Mahmoud',
          updatedAt: new Date(),
        },
        {
          department: 'HR',
          status: ApprovalStatus.PENDING,
          comments: 'Location: HR Office - S 205, Person in charge: Ms. Nada Kamal',
          updatedAt: new Date(),
        },
      ];

      const equipmentItems = [
        {
          name: 'Door Keys',
          returned: false,
          condition: 'Location: Security Office - Ground Floor, Person in charge: Mr. Mohamed Ali',
        },
        {
          name: 'Office equipment keys',
          returned: false,
          condition: 'Location: S 105, Person in charge: Mr. Khaled Mansour',
        },
        {
          name: 'Staff ID',
          returned: false,
          condition: 'Location: HR Office - S 205, Person in charge: Ms. Heba Fathy',
        },
        {
          name: 'Medical insurance Card',
          returned: false,
          condition: 'Location: HR Office - S 205, Person in charge: Ms. Heba Fathy',
        },
      ];

      const checklistData = {
        terminationId: savedTerminationRequest._id,
        items: departmentItems,
        equipmentList: equipmentItems,
        cardReturned: false,
      };

      await this.clearanceChecklistRepository.create(checklistData);
      console.log(`Offboarding checklist automatically created with 11 predefined items (7 departments + 4 equipment) for termination ${savedTerminationRequest._id}`);
    } catch (error) {
      console.error(`Failed to create offboarding checklist: ${error.message}`);
    }

    return savedTerminationRequest;
  }


  //OFF-006
  // (As an HR Manager, I want an offboarding checklist (IT assets, ID cards, equipment), so no company property is lost.)

  async initiateOffboardingChecklist(dto: InitiateOffboardingChecklistDto,
  ): Promise<ClearanceChecklist> {
    console.log(`Initiating offboarding checklist for termination request ${dto.terminationId}`);


    const terminationObjectId = new Types.ObjectId(dto.terminationId);

    const terminationRequest = await this.terminationRequestRepository
      .findById(terminationObjectId.toString());

    if (!terminationRequest) {
      console.error(`Termination request with ID ${dto.terminationId} not found`);
      throw new NotFoundException(`Termination request with ID ${dto.terminationId} not found`);
    }

    console.log(`Termination request ${dto.terminationId} validated successfully`);

    const existingChecklist = await this.clearanceChecklistRepository
      .findByTerminationId(terminationObjectId);

    if (existingChecklist) {
      console.warn(
        `Offboarding checklist already exists for termination request ${dto.terminationId}`,
      );
      throw new BadRequestException(`Offboarding checklist already exists for this Employee`
      );
    }

    // Step 2: Create predefined 11-item checklist with locations and persons in charge
    const departmentItems = [
      {
        department: 'Health Insurance',
        status: ApprovalStatus.PENDING,
        comments: 'Location: S 306, Person in charge: Dr. Ahmed Hassan',
        updatedAt: new Date(),
      },
      {
        department: 'Inventory',
        status: ApprovalStatus.PENDING,
        comments: 'Location: S 102, Person in charge: Ms. Sarah Ahmed',
        updatedAt: new Date(),
      },
      {
        department: 'Library',
        status: ApprovalStatus.PENDING,
        comments: 'Location: S 201, Person in charge: Ms. Fatma Ibrahim',
        updatedAt: new Date(),
      },
      {
        department: 'Post Grad Studies',
        status: ApprovalStatus.PENDING,
        comments: 'Location: S 401, Person in charge: Dr. Laila Mostafa',
        updatedAt: new Date(),
      },
      {
        department: 'Finance',
        status: ApprovalStatus.PENDING,
        comments: 'Location: S 203, Person in charge: Mr. Omar Salah',
        updatedAt: new Date(),
      },
      {
        department: 'IT Equipment',
        status: ApprovalStatus.PENDING,
        comments: 'Location: IT Department - S 301, Person in charge: Eng. Youssef Mahmoud',
        updatedAt: new Date(),
      },
      {
        department: 'HR',
        status: ApprovalStatus.PENDING,
        comments: 'Location: HR Office - S 205, Person in charge: Ms. Nada Kamal',
        updatedAt: new Date(),
      },
    ];

    console.log(`Processing ${departmentItems.length} department approval items with predefined locations and contacts`);

    const equipmentItems = [
      {
        name: 'Door Keys',
        returned: false,
        condition: 'Location: Security Office - Ground Floor, Person in charge: Mr. Mohamed Ali',
      },
      {
        name: 'Office equipment keys',
        returned: false,
        condition: 'Location: S 105, Person in charge: Mr. Khaled Mansour',
      },
      {
        name: 'Staff ID',
        returned: false,
        condition: 'Location: HR Office - S 205, Person in charge: Ms. Nada Kamal',
      },
      {
        name: 'Medical insurance Card',
        returned: false,
        condition: 'Location: HR Office - S 205, Person in charge: Ms. Heba Fathy',
      },
    ];

    console.log(`Processing ${equipmentItems.length} equipment items with locations and contacts`);

    const clearanceChecklistData = {
      terminationId: terminationObjectId,
      items: departmentItems,
      equipmentList: equipmentItems,
      cardReturned: false,
    };

    const savedChecklist = await this.clearanceChecklistRepository.create(clearanceChecklistData);

    console.log(`Offboarding checklist created successfully with ID ${savedChecklist._id}`);

    return savedChecklist;
  }


  //OFF-007
  //As a System Admin, I want to revoke system and account access upon termination, so security is maintained.

  async revokeSystemAccess(dto: RevokeSystemAccessDto): Promise<
    {
      message: string,
      employeeId: string,
      newStatus: EmployeeStatus,
      accessRevoked: boolean,
    }> {
    console.log(`System Admin initiating access revocation for termination request ${dto.terminationRequestId}`);

    const terminationObjectId = new Types.ObjectId(dto.terminationRequestId);

    const terminationRequest = await this.terminationRequestRepository
      .findById(terminationObjectId.toString());

    if (!terminationRequest) {
      console.error(`Termination request with ID ${dto.terminationRequestId} not found`);
      throw new NotFoundException(`Termination request with ID ${dto.terminationRequestId} not found`);
    }

    console.log(`Termination request ${dto.terminationRequestId} validated successfully`);

    // Check if termination date has expired
    const terminationDate = terminationRequest.terminationDate 
      ? new Date(terminationRequest.terminationDate) 
      : null;
    const isExpired = terminationDate && terminationDate < new Date();

    // Allow revocation if:
    // 1. Status is APPROVED (normal flow) OR
    // 2. Status is PENDING but termination date has expired (emergency flow)
    const isApproved = terminationRequest.status === TerminationStatus.APPROVED;
    const isPendingExpired = terminationRequest.status === TerminationStatus.PENDING && isExpired;

    if (!isApproved && !isPendingExpired) {
      console.warn(`Termination request ${dto.terminationRequestId} is not approved and not expired. Current status: ${terminationRequest.status}`);
      throw new BadRequestException(`Cannot revoke access for termination request with status: ${terminationRequest.status}. Only APPROVED terminations or PENDING terminations with expired dates can have access revoked.`);
    }

    if (isPendingExpired) {
      console.log(`EMERGENCY REVOCATION: Termination date expired (${terminationDate.toLocaleDateString()}) but status is still PENDING. Proceeding with access revocation.`);
    }

    // Step 3: Validate that all checklist items are handled before allowing access revocation
    const checklist = await this.clearanceChecklistRepository.findByTerminationId(terminationObjectId);

    if (!checklist) {
      console.error(`Clearance checklist not found for termination ${dto.terminationRequestId}`);
      throw new BadRequestException(`Cannot revoke access: Offboarding checklist must be created first for termination request ${dto.terminationRequestId}`);
    }

    // Check if all departments are approved
    const allDepartmentsApproved = checklist.items.every(item => item.status === ApprovalStatus.APPROVED);

    // Check if any department has rejected (cannot proceed if rejected)
    const anyDepartmentRejected = checklist.items.some(item => item.status === ApprovalStatus.REJECTED);

    // Check if any department is still pending
    const anyDepartmentPending = checklist.items.some(item => item.status === ApprovalStatus.PENDING);

    // Check if all equipment is returned
    const allEquipmentReturned = checklist.equipmentList.every(eq => eq.returned === true);

    // Check if card is returned
    const cardReturned = checklist.cardReturned === true;

    // For APPROVED terminations: All must be complete (no rejections, no pending)
    // For PENDING EXPIRED terminations: Allow revocation even if items pending (emergency override)
    if (isApproved) {
      // Strict validation for approved terminations
      if (anyDepartmentRejected) {
        const rejectedDepartments = checklist.items
          .filter(item => item.status === ApprovalStatus.REJECTED)
          .map(item => `${item.department} (Reason: ${item.comments || 'No reason provided'})`)
          .join(', ');

        const errorMessage = `Cannot revoke system access. The following departments have REJECTED clearance: ${rejectedDepartments}. Please resolve rejected items before proceeding.`;
        console.error(errorMessage);
        throw new BadRequestException(errorMessage);
      }

      if (!allDepartmentsApproved || !allEquipmentReturned || !cardReturned) {
        const pendingDepartments = checklist.items
          .filter(item => item.status === ApprovalStatus.PENDING)
          .map(item => item.department)
          .join(', ');

        const unreturnedEquipment = checklist.equipmentList
          .filter(eq => !eq.returned)
          .map(eq => eq.name)
          .join(', ');

        let errorMessage = 'Cannot revoke system access. Pending items: ';
        if (pendingDepartments) errorMessage += `Departments: ${pendingDepartments}. `;
        if (unreturnedEquipment) errorMessage += `Equipment: ${unreturnedEquipment}. `;
        if (!cardReturned) errorMessage += `Access card not returned. `;

        console.error(errorMessage);
        throw new BadRequestException(errorMessage);
      }
    } else if (isPendingExpired) {
      // For expired pending terminations, log incomplete items but allow revocation
      const incompleteItems: string[] = [];
      
      if (anyDepartmentRejected) {
        const rejectedDepartments = checklist.items
          .filter(item => item.status === ApprovalStatus.REJECTED)
          .map(item => item.department);
        incompleteItems.push(`Rejected departments: ${rejectedDepartments.join(', ')}`);
      }
      
      if (anyDepartmentPending) {
        const pendingDepartments = checklist.items
          .filter(item => item.status === ApprovalStatus.PENDING)
          .map(item => item.department);
        incompleteItems.push(`Pending departments: ${pendingDepartments.join(', ')}`);
      }
      
      if (!allEquipmentReturned) {
        const unreturnedEquipment = checklist.equipmentList
          .filter(eq => !eq.returned)
          .map(eq => eq.name);
        incompleteItems.push(`Unreturned equipment: ${unreturnedEquipment.join(', ')}`);
      }
      
      if (!cardReturned) {
        incompleteItems.push('Access card not returned');
      }

      if (incompleteItems.length > 0) {
        console.warn(`EMERGENCY REVOCATION: Proceeding despite incomplete items: ${incompleteItems.join(' | ')}`);
      }
    }

    console.log(`All checklist requirements validated for termination ${dto.terminationRequestId}. Proceeding with access revocation.`);
    //Ahmed been here
    let x = new UpdateEmployeeStatusDto
    x.status = EmployeeStatus.TERMINATED
    await this.employeeService.updateStatus(
      terminationRequest.employeeId.toString(), x
    );


    /*
    const employee = statusUpdateResult;
    const previousStatus = statusUpdateResult.previousStatus;

    console.log(`Employee ${employee.employeeNumber} status updated from ${previousStatus} to ${EmployeeStatus.TERMINATED}`);

    const roleDeactivationResult = await this.employeeService.deactivateSystemRole(
      terminationRequest.employeeId.toString()
    );

    const rolesDeactivated = roleDeactivationResult.rolesDeactivated;
    const previousRoles = roleDeactivationResult.previousRoles;
    const previousPermissions = roleDeactivationResult.previousPermissions;

    if (rolesDeactivated) {
      console.log(`System access revoked for employee ${employee.employeeNumber}`);
      console.log(`Deactivated roles: ${previousRoles.join(', ')}`);
      console.log(`Revoked permissions: ${previousPermissions.length} permission(s)`);
    } else {
      console.warn(`No system role found for employee ${employee.employeeNumber}`);

      //TODO: should i add throw error here?
    }

*/
    const employee = await this.employeeService.getProfile(terminationRequest.employeeId.toString());
    const securityNotificationPayload = {
      recipientId: [terminationRequest.employeeId], // TODO: Replace with actual System Admin / HR IDs
      type: 'Alert',
      deliveryType: 'MULTICAST',
      title: `Security Alert: Access Revoked for Terminated Employee ${terminationRequest.employeeId}`,
      message: `System and account access has been successfully revoked for the terminated employee.

Employee Details:
- Employee Number: ${employee.profile.employeeNumber}
- Name: ${employee.profile.firstName} ${employee.profile.lastName}
- Previous Status: N/A
- New Status: ${EmployeeStatus.TERMINATED}

Access Revocation:
- System Access Deactivated: Yes
- Previous Roles: N/A
- Permissions Revoked: N/A
- Effective Date: ${new Date().toISOString()}

Termination Details:
- Termination Request ID: ${terminationRequest._id}
- Initiated By: ${terminationRequest.initiator}
- Reason: ${terminationRequest.reason}
- Termination Date: ${terminationRequest.terminationDate || 'Not specified'}

Revocation Reason: ${dto.revocationReason || 'Standard termination procedure'}

Security Status: All system and account access has been revoked. Employee can no longer access company systems.`,
      relatedEntityId: terminationRequest._id.toString(),
      relatedModule: 'Recruitment',
      isRead: false,
    };

    await this.notificationService.create(securityNotificationPayload as any);

    console.log(`Security notification sent for access revocation of employee ${terminationRequest.employeeId}`);

    const employeeNotificationPayload = {
      recipientId: [terminationRequest.employeeId],
      type: 'Info',
      deliveryType: 'UNICAST',
      title: `Account Access Update`,
      message: `Your system and account access has been updated following your termination.

Employee Number: ${employee.profile.employeeNumber}
Status: ${EmployeeStatus.TERMINATED}
Effective Date: ${new Date().toISOString()}

Please contact HR if you have any questions regarding your final settlement or benefits.`,
      relatedEntityId: terminationRequest._id.toString(),
      relatedModule: 'Recruitment',
      isRead: false,
    };

    await this.notificationService.create(employeeNotificationPayload as any);

    console.log(`Informational notification sent to terminated employee ${terminationRequest.employeeId}`);

    console.log(`Access revocation completed successfully for employee ${terminationRequest.employeeId}`);

    return {
      message: `System and account access successfully revoked for employee ${terminationRequest.employeeId}`,
      employeeId: terminationRequest.employeeId.toString(),
      newStatus: EmployeeStatus.TERMINATED,
      accessRevoked: true,
    };
  }






  //OFF-013
  //As HR Manager, I want to send offboarding notification to trigger benefits termination and final pay calc (unused leave, deductions), so settlements are accurate.
  async sendOffboardingNotification(dto: { terminationRequestId: string; additionalMessage?: string },): Promise<any> {
    console.log(`Sending offboarding notification for termination request ${dto.terminationRequestId}`);

    const terminationObjectId = new Types.ObjectId(dto.terminationRequestId);

    const terminationRequest = await this.terminationRequestRepository
      .findById(terminationObjectId.toString());

    if (!terminationRequest) {
      console.error(`Termination request with ID ${dto.terminationRequestId} not found`);
      throw new NotFoundException(`Termination request with ID ${dto.terminationRequestId} not found`);
    }

    console.log(`Termination request ${dto.terminationRequestId} validated successfully`);

    const employee = await this.employeeService.getProfile(
      terminationRequest.employeeId.toString()
    );

    if (!employee) {
      console.error(`Employee with ID ${terminationRequest.employeeId} not found`);
      throw new NotFoundException(`Employee with ID ${terminationRequest.employeeId} not found`);
    }

    console.log(`Employee ${employee.profile.employeeNumber} retrieved successfully`);

    // Load leave entitlements using the LeavesRequestService
    let leaveEntitlements: any[] = [];
    try {
      //leaveEntitlements = await this.leavesRequestService.getLeaveEntitlementByEmployeeId(terminationRequest.employeeId.toString());  check this later on
    } catch (err) {
      console.warn('Failed to load leave entitlements:', err?.message || err);
      leaveEntitlements = [];
    }

    // Attempt to load contract and extract benefits array
    let benefits: any[] = [];
    try {
      // Normalize contractId to a string to satisfy repository API
      const contractId: string | undefined = terminationRequest.contractId
        ? terminationRequest.contractId.toString()
        : undefined;
      if (contractId) {
        const contract = await this.contractRepository.findById(contractId);
        benefits = contract?.benefits || [];
      }
    } catch (err) {
      console.warn('Failed to load contract or benefits array:', err?.message || err);
      benefits = [];
    }

    // Trigger benefit termination via a createEmployeeTermination service if available on this instance
    try {
      if ((this as any).employeeTerminationService && typeof (this as any).employeeTerminationService.createEmployeeTermination === 'function') {
        await (this as any).employeeTerminationService.createEmployeeTermination(terminationRequest.employeeId.toString(), benefits);
        console.log('Triggered createEmployeeTermination for benefits termination');
      } else {
        console.warn('createEmployeeTermination service not available on this instance; skipping benefit termination trigger');
      }
    } catch (err) {
      console.error('Error triggering benefit termination:', err?.message || err);
    }


    // Build leave summary
    let totalUnusedAnnualLeave = 0;
    const unusedLeaveDetails: string[] = [];
    try {
      for (const entitlement of leaveEntitlements) {
        // entitlement may be either the raw entitlement (with leaveTypeId populated) or a mapped balance
        const leaveType = entitlement.leaveTypeId || entitlement.leaveType || entitlement.leaveTypeId?.name || null;
        const remaining = entitlement.remaining ?? entitlement.balance ?? 0;
        // If leaveType is an object, try to read paid/deductible flags
        const paid = leaveType?.paid ?? (leaveType?.paid === undefined ? true : leaveType.paid);
        const deductible = leaveType?.deductible ?? true;
        const name = (leaveType && (leaveType.name || leaveType.leaveTypeName)) || entitlement.leaveTypeId?.toString?.() || 'Leave';

        if (remaining > 0 && paid !== false && deductible !== false) {
          totalUnusedAnnualLeave += remaining;
          unusedLeaveDetails.push(`${name}: ${remaining} days (to be encashed)`);
        }
      }
    } catch (err) {
      console.warn('Error processing leave entitlements for offboarding notification:', err?.message || err);
    }

    // Build notification payload (multiline message)
    const notificationTitle = `Offboarding Notification: ${employee.profile.employeeNumber}`;

    const notificationMessage = `Offboarding notification for employee ${employee.profile.employeeNumber}.

Termination Status: ${terminationRequest.status}
Termination Reason: ${terminationRequest.reason}
Initiated By: ${terminationRequest.initiator}

--- LEAVE BALANCE REVIEW ---
${totalUnusedAnnualLeave > 0 ? `Total Unused Annual Leave: ${totalUnusedAnnualLeave} days\nDetails:\n${unusedLeaveDetails.join('\n')}\n\nAction Required: Encash unused annual leave in final settlement\n` : 'No unused annual leave to be encashed\n'}

--- BENEFITS TERMINATION ---
${benefits.length > 0 ? benefits.map((b: any) => `- ${b.name || b}`).join('\n') : 'No contract benefits found to terminate'}

${dto.additionalMessage ? `--- ADDITIONAL NOTES ---\n${dto.additionalMessage}\n\n` : ''}This notification triggers the final settlement and benefit termination process. Please review and process accordingly.`;

    // Send notification to Payroll, Finance, HR, and Employee
    // TODO: Replace hardcoded IDs with actual Payroll/Finance/HR role/department lookup
    const recipients = [terminationRequest.employeeId];

    // Add HR, Payroll, and Finance recipients here
    // For now, sending to employee; integrate with role-based user lookup when available

    const notificationPayload = {
      recipientId: recipients,
      type: 'Alert',
      deliveryType: 'MULTICAST',
      title: notificationTitle,
      message: notificationMessage,
      relatedEntityId: terminationObjectId.toString(),
      relatedModule: 'Recruitment',
      isRead: false,
    };

    const savedNotification = await this.notificationService.create(notificationPayload as any);

    console.log(`Offboarding notification sent to ${recipients.length} recipient(s) including employee, HR, Payroll, and Finance`);
    return savedNotification;
  }


  //OFF-018
  //As an Employee, I want to be able to request a Resignation request with reasoning
  async submitResignation(dto: SubmitResignationDto): Promise<TerminationRequest> {
    console.log(`Employee ${dto.employeeId} submitting resignation request`);
    const employeeObjectId = new Types.ObjectId(dto.employeeId);

    const employee = await this.employeeService.getProfile(dto.employeeId);

    if (!employee) {
      console.error(`Employee with ID ${dto.employeeId} not found`);
      throw new NotFoundException(`Employee with ID ${dto.employeeId} not found`);
    }

    console.log(`Employee ${employee.profile.employeeNumber} validated successfully`);

    // Find the contract automatically using employee → candidate → offer → contract flow
    let contractId: Types.ObjectId;
    try {
      const employeeNumber = employee.profile.employeeNumber;
      console.log(`Finding contract for employee number: ${employeeNumber}`);

      if (!employeeNumber || !employeeNumber.startsWith('EMP')) {
        throw new Error(`Invalid employee number format: ${employeeNumber}`);
      }

      const candidateNumber = 'CAN' + employeeNumber.substring(3);
      const candidate = await this.candidateRepository.findByCandidateNumber(candidateNumber);
      if (!candidate) {
        throw new Error(`Candidate with number ${candidateNumber} not found`);
      }

      const offers = await this.offerRepository.findByCandidateId(candidate._id.toString());
      if (!offers || offers.length === 0) {
        throw new Error(`No offers found for candidate ${candidateNumber}`);
      }

      const acceptedOffer = offers.find(offer => offer.applicantResponse === OfferResponseStatus.ACCEPTED);
      if (!acceptedOffer) {
        throw new Error(`No accepted offer found for candidate ${candidateNumber}`);
      }

      const contract = await this.contractRepository.findOne({ offerId: acceptedOffer._id });
      if (!contract) {
        throw new Error(`Contract not found for accepted offer ${acceptedOffer._id}`);
      }

      contractId = contract._id;
      console.log(`Contract ${contractId} found and validated successfully`);
    } catch (error) {
      console.error(`Failed to find contract: ${error.message}`);
      throw new NotFoundException(`Unable to find contract for employee. ${error.message}`);
    }

    const existingTerminationRequest = await this.terminationRequestRepository
      .findActiveByEmployeeId(dto.employeeId);

    if (existingTerminationRequest) {
      console.warn(`Employee ${dto.employeeId} already has an active resignation/termination request`);
      throw new BadRequestException(`You already have an active resignation/termination request with status: ${existingTerminationRequest.status}`);
    }

    const savedResignation = await this.terminationRequestRepository.create({
      employeeId: employeeObjectId,
      contractId: contractId,
      initiator: TerminationInitiation.EMPLOYEE,
      reason: dto.reason,
      employeeComments: dto.employeeComments,
      status: TerminationStatus.PENDING,
      terminationDate: dto.proposedLastWorkingDay,
    });

    console.log(`Resignation submitted successfully with ID ${savedResignation._id}`);

    // Step 1: Automatically create employee termination/resignation benefits record
    console.log(`Creating termination benefits record for employee ${dto.employeeId}...`);
    try {
      // Step 1.1: Get employee profile to extract employee number
      const employeeProfile = await this.employeeService.getProfile(dto.employeeId);
      if (!employeeProfile || !employeeProfile.profile) {
        throw new Error('Employee profile not found');
      }

      const employeeNumber = employeeProfile.profile.employeeNumber;
      console.log(`Employee number: ${employeeNumber}`);

      // Step 1.2: Convert employee number to candidate number (EMP -> CAN)
      if (!employeeNumber || !employeeNumber.startsWith('EMP')) {
        throw new Error(`Invalid employee number format: ${employeeNumber}`);
      }
      const candidateNumber = 'CAN' + employeeNumber.substring(3);
      console.log(`Converted to candidate number: ${candidateNumber}`);

      // Step 1.3: Find candidate by candidate number
      const candidate = await this.candidateRepository.findByCandidateNumber(candidateNumber);
      if (!candidate) {
        throw new Error(`Candidate with number ${candidateNumber} not found`);
      }
      console.log(`Found candidate with ID: ${candidate._id}`);

      // Step 1.4: Find offers for the candidate
      const offers = await this.offerRepository.findByCandidateId(candidate._id.toString());
      if (!offers || offers.length === 0) {
        throw new Error(`No offers found for candidate ${candidateNumber}`);
      }
      console.log(`Found ${offers.length} offer(s) for candidate`);

      // Step 1.5: Find the accepted offer
      const acceptedOffer = offers.find(offer => offer.applicantResponse === OfferResponseStatus.ACCEPTED);
      if (!acceptedOffer) {
        throw new Error(`No accepted offer found for candidate ${candidateNumber}`);
      }
      console.log(`Found accepted offer with ID: ${acceptedOffer._id}`);

      // Step 1.6: Find contract using the accepted offer ID
      const resignationContract = await this.contractRepository.findOne({ offerId: acceptedOffer._id });
      if (!resignationContract) {
        throw new Error(`Contract not found for accepted offer ${acceptedOffer._id}`);
      }
      console.log(`Found contract with ID: ${resignationContract._id}`);
      console.log(`Contract benefits:`, resignationContract.benefits);
      console.log(`Offer benefits:`, acceptedOffer.benefits);

      // Step 1.7: Extract benefits from contract, fallback to offer benefits if contract has none
      let benefits = resignationContract.benefits || [];

      // If contract has no benefits, try to get them from the offer
      if (benefits.length === 0 && acceptedOffer.benefits && acceptedOffer.benefits.length > 0) {
        console.log(`No benefits in contract, using benefits from offer instead`);
        benefits = acceptedOffer.benefits;
      }

      if (benefits.length === 0) {
        throw new Error(`No benefits found in contract or offer for candidate ${candidateNumber}`);
      }
      console.log(`Found ${benefits.length} benefits: ${benefits.join(', ')}`);

      // Step 1.8: Use the benefits as the benefit name (combine if multiple)
      const benefitName = benefits.join(', ');

      console.log(`Using benefit name: ${benefitName}`);

      const terminationBenefitDto = {
        employeeId: dto.employeeId,
        benefitName: benefitName,
        terminationId: savedResignation._id.toString(),
      };

      const terminationBenefit = await this.employeeTerminationService.createEmployeeTermination(terminationBenefitDto);
      console.log(`✓ Employee termination benefits record created successfully for employee ${dto.employeeId}`);
      console.log(`Benefit details:`, terminationBenefit);
    } catch (error) {
      console.error(`✗ Failed to create termination benefits record: ${error.message}`);
      console.error(`This may be due to missing benefit configuration in the database. The resignation will proceed, but benefits calculation may need manual review.`);
      // Continue with resignation process even if benefit creation fails
      // HR can manually create the benefit record later if needed
    }

    // Step 2: Send notifications to all departments
    const departments = [
      'Health Insurance',
      'Inventory',
      'Library',
      'Post Grad Studies',
      'Finance',
      'IT Equipment',
      'HR'
    ];

    for (const department of departments) {
      try {
        await this.notificationService.create({
          recipientId: [dto.employeeId],
          type: 'Alert',
          deliveryType: 'MULTICAST',
          title: `Resignation Notification - ${department} Department`,
          message: `Employee resignation has been submitted. Please prepare for offboarding checklist processing. Department: ${department}`,
          relatedEntityId: savedResignation._id.toString(),
        });
        console.log(`Notification sent to ${department} department`);
      } catch (error) {
        console.error(`Failed to send notification to ${department}: ${error.message}`);
      }
    }

    // Step 3: Automatically create offboarding checklist with predefined items
    try {
      // Create predefined 11-item checklist with locations and persons in charge
      const departmentItems = [
        {
          department: 'Health Insurance',
          status: ApprovalStatus.PENDING,
          comments: 'Location: S 306, Person in charge: Dr. Ahmed Hassan',
          updatedAt: new Date(),
        },
        {
          department: 'Inventory',
          status: ApprovalStatus.PENDING,
          comments: 'Location: S 102, Person in charge: Ms. Sarah Ahmed',
          updatedAt: new Date(),
        },
        {
          department: 'Library',
          status: ApprovalStatus.PENDING,
          comments: 'Location: S 201, Person in charge: Ms. Fatma Ibrahim',
          updatedAt: new Date(),
        },
        {
          department: 'Post Grad Studies',
          status: ApprovalStatus.PENDING,
          comments: 'Location: S 401, Person in charge: Dr. Laila Mostafa',
          updatedAt: new Date(),
        },
        {
          department: 'Finance',
          status: ApprovalStatus.PENDING,
          comments: 'Location: S 203, Person in charge: Mr. Omar Salah',
          updatedAt: new Date(),
        },
        {
          department: 'IT Equipment',
          status: ApprovalStatus.PENDING,
          comments: 'Location: IT Department - S 301, Person in charge: Eng. Youssef Mahmoud',
          updatedAt: new Date(),
        },
        {
          department: 'HR',
          status: ApprovalStatus.PENDING,
          comments: 'Location: HR Office - S 205, Person in charge: Ms. Nada Kamal',
          updatedAt: new Date(),
        },
      ];

      const equipmentItems = [
        {
          name: 'Door Keys',
          returned: false,
          condition: 'Location: Security Office - Ground Floor, Person in charge: Mr. Mohamed Ali',
        },
        {
          name: 'Office equipment keys',
          returned: false,
          condition: 'Location: S 105, Person in charge: Mr. Khaled Mansour',
        },
        {
          name: 'Staff ID',
          returned: false,
          condition: 'Location: HR Office - S 205, Person in charge: Ms. Heba Fathy',
        },
        {
          name: 'Medical insurance Card',
          returned: false,
          condition: 'Location: HR Office - S 205, Person in charge: Ms. Heba Fathy',
        },
      ];

      const checklistData = {
        terminationId: savedResignation._id,
        items: departmentItems,
        equipmentList: equipmentItems,
        cardReturned: false,
      };

      await this.clearanceChecklistRepository.create(checklistData);
      console.log(`Offboarding checklist automatically created with 11 predefined items (7 departments + 4 equipment) for resignation ${savedResignation._id}`);
    } catch (error) {
      console.error(`Failed to create offboarding checklist: ${error.message}`);
    }

    //Send notification to line manager for approval (first step in approval workflow)
    // Employee resigning > Line Manager > Financial approval > HR processing/approval
    // Retrieve employee's supervisor/manager from EmployeeProfile schema

    //let managerNotificationSent = false;

    if (employee.profile.supervisorPositionId) {

      //TODO: what if the supervisor is not found??
      //should i stop the whole workflow untill a supervisor is found?

      console.log(`Preparing notification for line manager approval`);

      const managerNotificationPayload = {
        recipientId: [employeeObjectId], // TODO: Replace with actual manager ID lookup
        type: 'Alert',
        // deliveryType is 'UNICAST' to send to the specific line manager from Notification schema enum
        deliveryType: 'UNICAST',
        // Title indicating resignation approval required
        title: `Resignation Request - ${employee.profile.employeeNumber}`,
        // Message with resignation details for manager review
        message: `Employee ${employee.profile.employeeNumber} has submitted a resignation request.

      Reason: ${dto.reason}

      Proposed Last Working Day: ${dto.proposedLastWorkingDay || 'To be determined'}

      Action Required: Please review and approve/reject this resignation request. Upon your approval, it will proceed to Financial approval and then HR processing.

      Workflow: Employee > Line Manager (PENDING) > Financial > HR`,
        // relatedEntityId references the resignation request as per Notification schema
        relatedEntityId: savedResignation._id.toString(),
        // relatedModule is 'Recruitment' to identify the source module as per Notification schema
        relatedModule: 'Recruitment',
        // isRead defaults to false as per Notification schema
        isRead: false,
      };

      await this.notificationService.create(managerNotificationPayload as any);

      //managerNotificationSent = true;
      console.log(`Notification sent to line manager for resignation approval`);
    }

    //TODO:
    // after the notification was sent to the manager:

    //financial approval notification will be added
    //notification will be sent to the HR for processing/approval



    //TODO:
    //should the confirmation notification sent to the employee after the approval of all the entities the notification was sent to them in the workflow?

    //Send confirmation notification to employee
    // Using Notification model from employee-subsystem/notification
    const employeeNotificationPayload = {
      // recipientId is the employee who submitted the resignation
      recipientId: [employeeObjectId],
      // Type is 'Info' as this is a confirmation notification from Notification schema enum
      type: 'Info',
      // deliveryType is 'UNICAST' to send only to the employee from Notification schema enum
      deliveryType: 'UNICAST',
      // Title confirming resignation submission
      title: `Resignation Request Submitted`,
      // Message confirming submission and explaining approval workflow
      message: `Your resignation request has been successfully submitted.

    Request ID: ${savedResignation._id}
    Status: ${savedResignation.status}
    Reason: ${dto.reason}
    Proposed Last Working Day: ${dto.proposedLastWorkingDay || 'To be determined'}

    Your resignation will go through the following approval workflow:
    1. Line Manager Review (CURRENT STEP)
    2. Financial Approval
    3. HR Processing/Approval

    You will be notified at each step. You can track your resignation status at any time.`,
      // relatedEntityId references the resignation request as per Notification schema
      relatedEntityId: savedResignation._id.toString(),
      // relatedModule is 'Recruitment' to identify the source module as per Notification schema
      relatedModule: 'Recruitment',
      // isRead defaults to false as per Notification schema
      isRead: false,
    };

    await this.notificationService.create(employeeNotificationPayload as any);

    console.log(`Confirmation notification sent to employee`);

    return savedResignation;
  }


  //OFF-019
  //As an Employee, I want to be able to track my resignation request status.

  async trackResignationStatus(dto: TrackResignationStatusDto): Promise<TerminationRequest[]> {
    console.log(`Employee ${dto.employeeId} tracking resignation status`);
    const employeeObjectId = new Types.ObjectId(dto.employeeId);

    const employee = await this.employeeService.getProfile(dto.employeeId);

    if (!employee) {
      console.error(`Employee with ID ${dto.employeeId} not found`);
      throw new NotFoundException(`Employee with ID ${dto.employeeId} not found`);
    }
    console.log(`Employee ${employee.profile.employeeNumber} validated successfully`);

    const resignationRequests = await this.terminationRequestRepository
      .findByEmployeeAndInitiator(employeeObjectId, TerminationInitiation.EMPLOYEE);

    console.log(`Found ${resignationRequests.length} resignation request(s) for employee ${employee.profile.employeeNumber}`);

    //TODO:
    //can the same employee have multiple resignation requests?

    resignationRequests.forEach((request) => {
      console.log(`Resignation ${request._id}: Status = ${request.status}`);
    });

    // Return the array of resignation requests with their current status to the controller
    // Employee can see:
    // - Request ID, creation date, reason
    // - Current status (PENDING, UNDER_REVIEW, APPROVED, REJECTED)
    // - Proposed termination date
    // - Comments from employee and HR
    return resignationRequests;
  }





  //OFF-010
  //As HR Manager, I want multi-department exit clearance sign-offs (IT, Finance, Facilities, Line Manager), with statuses, so the employee is fully cleared.

  async processDepartmentSignOff(dto: DepartmentClearanceSignOffDto): Promise<{
    message: string;
    clearanceChecklistId: string;
    department: string; // can we take it from the token?
    status: string;
    approverId: string; // can we take it from the token?
    allDepartmentsApproved: boolean;
    anyDepartmentRejected: boolean;
    pendingDepartments: string[];
    clearanceProgress: {
      total: number;
      approved: number;
      rejected: number;
      pending: number;
    };
  }> {

    console.log(`Department ${dto.department} processing clearance sign-off for checklist ${dto.clearanceChecklistId}`);

    const checklistObjectId = new Types.ObjectId(dto.clearanceChecklistId);
    const approverObjectId = dto.approverId ? new Types.ObjectId(dto.approverId) : null;

    const clearanceChecklist = await this.clearanceChecklistRepository
      .findById(checklistObjectId.toString());

    if (!clearanceChecklist) {
      console.error(`Clearance checklist with ID ${dto.clearanceChecklistId} not found`);
      throw new NotFoundException(`Clearance checklist with ID ${dto.clearanceChecklistId} not found`);
    }

    console.log(`Clearance checklist ${dto.clearanceChecklistId} validated successfully`);

    const departmentItem = clearanceChecklist.items.find(
      (item) => item.department === dto.department,
    );

    if (!departmentItem) {
      console.error(`Department ${dto.department} not found in clearance checklist items`);
      throw new NotFoundException(
        `Department ${dto.department} not found in clearance checklist items. Available departments: ${clearanceChecklist.items.map((item) => item.department).join(', ')}`,
      );
    }


    console.log(`Department item found for ${dto.department}. Current status: ${departmentItem.status}`);

    const previousStatus = departmentItem.status;

    // Store status directly as received from frontend (TerminationStatus enum values)
    // Accepts: 'pending', 'under_review', 'approved', 'rejected'
    departmentItem.status = dto.status as any;
    if (approverObjectId) {
      departmentItem.updatedBy = approverObjectId; // Track who made the approval/rejection (if provided)
    }
    departmentItem.updatedAt = new Date();

    if (dto.comments) {
      departmentItem.comments = dto.comments;
    }

    await this.clearanceChecklistRepository.updateById(checklistObjectId.toString(), clearanceChecklist);

    console.log(`Department ${dto.department} sign-off updated from ${previousStatus} to ${dto.status}`);

    // Calculate overall clearance progress across all departments
    // Check if all departments have approved their clearance items
    const allDepartmentsApproved = clearanceChecklist.items.every(
      (item) => item.status === ApprovalStatus.APPROVED,
    );

    // Check if any department has rejected their clearance items
    const anyDepartmentRejected = clearanceChecklist.items.some(
      (item) => item.status === ApprovalStatus.REJECTED,
    );

    // Get list of departments still pending approval
    const pendingDepartments = clearanceChecklist.items
      .filter((item) => item.status === ApprovalStatus.PENDING)
      .map((item) => item.department);

    // Calculate clearance progress statistics
    const totalDepartments = clearanceChecklist.items.length;
    const approvedCount = clearanceChecklist.items.filter(
      (item) => item.status === ApprovalStatus.APPROVED,
    ).length;
    const rejectedCount = clearanceChecklist.items.filter(
      (item) => item.status === ApprovalStatus.REJECTED,
    ).length;
    const pendingCount = clearanceChecklist.items.filter(
      (item) => item.status === ApprovalStatus.PENDING,
    ).length;

    console.log(`Clearance progress: ${approvedCount}/${totalDepartments} approved, ${rejectedCount} rejected, ${pendingCount} pending`);

    //Retrieve termination request to get employee information for notifications
    // Using TerminationRequest model from Recruitment models
    const terminationRequest = await this.terminationRequestRepository
      .findById(clearanceChecklist.terminationId.toString());

    if (!terminationRequest) {
      console.warn(`Termination request ${clearanceChecklist.terminationId} not found. Skipping notifications.`);
    } else {
      // Retrieve employee profile for name and department information
      let employeeName = 'Employee';
      let employeeDepartment = 'N/A';
      try {
        const employeeProfile = await this.employeeService.getProfile(
          terminationRequest.employeeId.toString()
        );
        if (employeeProfile?.profile) {
          employeeName = `${employeeProfile.profile.firstName || ''} ${employeeProfile.profile.lastName || ''}`.trim();
          employeeDepartment = employeeProfile.profile.department || 'N/A';
        }
      } catch (error) {
        console.warn(`Could not retrieve employee profile: ${error.message}`);
      }

      //Send notification to employee about the department sign-off decision
      // Using Notification model from employee-subsystem/notification

      // Build small helper blocks to avoid literal "\\n" showing up
      const commentsBlock = dto.comments ? `Comments from ${dto.department}: ${dto.comments}

    ` : '';
      const pendingBlock = pendingDepartments.length > 0 ? `Pending Departments: ${pendingDepartments.join(', ')}

    ` : '';
      const statusMessage = allDepartmentsApproved
        ? 'Congratulations! You have received clearance from all departments. Your offboarding process is complete.'
        : anyDepartmentRejected
          ? 'Please resolve rejected clearance items to proceed with your offboarding.'
          : 'Please continue to work with pending departments to complete your clearance.';

      const employeeNotificationPayload = {
        // recipientId is the employee going through offboarding
        recipientId: [terminationRequest.employeeId],
        // Type depends on approval status: 'Alert' for rejection, 'Info' for approval
        type: dto.status === ApprovalStatus.REJECTED ? 'Alert' : 'Info',
        // deliveryType is 'UNICAST' to send only to the employee from Notification schema enum
        deliveryType: 'UNICAST',
        // Title indicating department clearance status
        title: `Exit Clearance Update: ${dto.department} - ${dto.status}`,
        // Message with department sign-off details and next steps (multiline)
        message: `Your exit clearance for ${dto.department} has been ${dto.status.toLowerCase()}.

    ${commentsBlock}Clearance Progress:
    - Total Departments: ${totalDepartments}
    - Approved: ${approvedCount}
    - Rejected: ${rejectedCount}
    - Pending: ${pendingCount}

    ${pendingBlock}${statusMessage}`,
        // relatedEntityId references the clearance checklist as per Notification schema
        relatedEntityId: clearanceChecklist._id.toString(),
        // relatedModule is 'Recruitment' to identify the source module as per Notification schema
        relatedModule: 'Recruitment',
        // isRead defaults to false as per Notification schema
        isRead: false,
      };

      await this.notificationService.create(employeeNotificationPayload as any);

      console.log(`Department sign-off notification sent to employee`);

      // If department approved, send notification to HR/system admin about the approval
      if (dto.status === ApprovalStatus.APPROVED && previousStatus !== ApprovalStatus.APPROVED) {
        const departmentApprovalNotificationPayload = {
          // recipientId should be HR managers and system admins
          recipientId: [terminationRequest.employeeId], // TODO: Replace with actual HR/admin IDs
          // Type is 'Info' as this is a status update
          type: 'Info',
          // deliveryType is 'MULTICAST' to send to multiple recipients
          deliveryType: 'MULTICAST',
          // Title indicating department approval
          title: `Offboarding Clearance Approved: ${dto.department}`,
          // Message with approval details including employee name and department
          message: `${dto.department} has approved the offboarding clearance.

Employee: ${employeeName} (ID: ${terminationRequest.employeeId.toString().slice(-8)})
Department: ${employeeDepartment}
Cleared By: ${dto.department}
Comments: ${dto.comments || 'None'}

Clearance Progress:
- Total Departments: ${totalDepartments}
- Approved: ${approvedCount}/${totalDepartments}
- Rejected: ${rejectedCount}
- Pending: ${pendingCount}
${pendingDepartments.length > 0 ? `\nPending Departments: ${pendingDepartments.join(', ')}` : ''}

${allDepartmentsApproved ? 'All departments have approved! Ready for system access revocation.' : `Still awaiting approval from ${pendingCount} department(s).`}`,
          // relatedEntityId references the clearance checklist
          relatedEntityId: clearanceChecklist._id.toString(),
          // relatedModule is 'Recruitment'
          relatedModule: 'Recruitment',
          // isRead defaults to false
          isRead: false,
        };

        await this.notificationService.create(departmentApprovalNotificationPayload as any);

        console.log(`Department approval notification sent to HR/admins for ${dto.department}`);
      }

      //If all departments approved, send final clearance completion notification to system admin
      if (allDepartmentsApproved) {
        const completionNotificationPayload = {
          // recipientId should be system admins who can revoke access
          recipientId: [terminationRequest.employeeId], // TODO: Replace with actual system admin IDs
          // Type is 'Alert' as this is a critical milestone requiring admin action
          type: 'Alert',
          // deliveryType is 'MULTICAST' to send to all system admins
          deliveryType: 'MULTICAST',
          // Title indicating full clearance achieved
          title: `System Access Revocation Required: ${employeeName}`,
          // Message with complete clearance confirmation and action required
          message: `All departments have approved the offboarding clearance for ${employeeName}.

Employee Details:
- Name: ${employeeName}
- Employee ID: ${terminationRequest.employeeId.toString().slice(-8)}
- Department: ${employeeDepartment}
- Termination Date: ${terminationRequest.terminationDate ? new Date(terminationRequest.terminationDate).toLocaleDateString() : 'TBD'}

Departments Cleared (${totalDepartments}/${totalDepartments}):
${clearanceChecklist.items.map((item) => `✓ ${item.department}: Approved${item.updatedAt ? ` on ${new Date(item.updatedAt).toLocaleDateString()}` : ''}`).join('\n')}

ACTION REQUIRED:
System administrators can now proceed to revoke system access for this employee.

Next Steps:
1. Verify all equipment has been returned
2. Confirm access card has been collected
3. Revoke all system access and permissions
4. Complete final settlement processing`,
          // relatedEntityId references the clearance checklist
          relatedEntityId: clearanceChecklist._id.toString(),
          relatedModule: 'Recruitment',
          // isRead defaults to false
          isRead: false,
        };

        await this.notificationService.create(completionNotificationPayload as any);

        console.log(`System admin notification sent - all departments approved for ${employeeName}`);
      }

      //If any department rejected, send alert to HR for intervention
      if (
        dto.status === ApprovalStatus.REJECTED &&
        previousStatus !== ApprovalStatus.REJECTED
      ) {
        const rejectionAlertPayload = {
          // recipientId should be HR managers for intervention
          recipientId: [terminationRequest.employeeId], // TODO: Replace with actual HR manager IDs
          // Type is 'Alert' as this requires HR intervention from Notification schema enum
          type: 'Alert',
          // deliveryType is 'MULTICAST' to send to multiple HR personnel from Notification schema enum
          deliveryType: 'MULTICAST',
          // Title indicating rejection requiring attention
          title: `Exit Clearance Rejection: ${dto.department}`,
          // Message with rejection details for HR intervention
          message: `Department ${dto.department} has rejected the exit clearance.

Employee: ${terminationRequest.employeeId}
Department: ${dto.department}
Status: ${dto.status}
Rejection Reason: ${dto.comments || 'Not specified'}

Action Required: Please coordinate with ${dto.department} to resolve the clearance issues and facilitate the employee's offboarding process.

Clearance Progress:
- Approved: ${approvedCount}
- Rejected: ${rejectedCount}
- Pending: ${pendingCount}`,
          // relatedEntityId references the clearance checklist as per Notification schema
          relatedEntityId: clearanceChecklist._id.toString(),
          // relatedModule is 'Recruitment' to identify the source module as per Notification schema
          relatedModule: 'Recruitment',
          // isRead defaults to false as per Notification schema
          isRead: false,
        };

        await this.notificationService.create(rejectionAlertPayload as any);

        console.log(`Rejection alert sent to HR for ${dto.department}`);
      }
    }
    console.log(`Department sign-off processing completed successfully for ${dto.department}`);

    // Check if all clearance requirements are met and auto-approve termination
    await this.checkAndAutoApproveTermination(clearanceChecklist._id.toString());

    // Return comprehensive clearance status to the controller
    return {
      message: `Department ${dto.department} sign-off processed successfully`,
      clearanceChecklistId: clearanceChecklist._id.toString(),
      department: dto.department,
      status: dto.status,
      approverId: dto.approverId ? dto.approverId : '',
      allDepartmentsApproved: allDepartmentsApproved,
      anyDepartmentRejected: anyDepartmentRejected,
      pendingDepartments: pendingDepartments,
      clearanceProgress: {
        total: totalDepartments,
        approved: approvedCount,
        rejected: rejectedCount,
        pending: pendingCount,
      },
    };
  }

  //Update equipment return status in clearance checklist
  async updateEquipmentReturnStatus(
    clearanceChecklistId: string,
    equipmentName: string,
    returned: boolean,
    _updatedById: string, // Currently not stored in schema, but available for future tracking
  ): Promise<{
    message: string;
    clearanceChecklistId: string;
    equipmentName: string;
    returned: boolean;
    allEquipmentReturned: boolean;
  }> {
    console.log(`Updating equipment "${equipmentName}" return status to ${returned} in checklist ${clearanceChecklistId}`);

    const checklistObjectId = new Types.ObjectId(clearanceChecklistId);

    const clearanceChecklist = await this.clearanceChecklistRepository
      .findById(checklistObjectId.toString());

    if (!clearanceChecklist) {
      console.error(`Clearance checklist with ID ${clearanceChecklistId} not found`);
      throw new NotFoundException(`Clearance checklist with ID ${clearanceChecklistId} not found`);
    }

    // Find the equipment item by name
    const equipmentItem = clearanceChecklist.equipmentList.find(
      (item) => item.name === equipmentName,
    );

    if (!equipmentItem) {
      console.error(`Equipment "${equipmentName}" not found in clearance checklist`);
      throw new NotFoundException(
        `Equipment "${equipmentName}" not found in clearance checklist. Available equipment: ${clearanceChecklist.equipmentList.map((item) => item.name).join(', ')}`,
      );
    }

    const previousStatus = equipmentItem.returned;
    equipmentItem.returned = returned;

    await this.clearanceChecklistRepository.updateById(checklistObjectId.toString(), clearanceChecklist);

    console.log(`Equipment "${equipmentName}" return status updated from ${previousStatus} to ${returned}`);

    // Check if all equipment has been returned
    const allEquipmentReturned = clearanceChecklist.equipmentList.every(
      (item) => item.returned === true,
    );

    // Get termination request for employee information and notifications
    const terminationRequest = await this.terminationRequestRepository
      .findById(clearanceChecklist.terminationId.toString());

    if (terminationRequest) {
      // Retrieve employee profile for name
      let employeeName = 'Employee';
      let employeeDepartment = 'N/A';
      try {
        const employeeProfile = await this.employeeService.getProfile(
          terminationRequest.employeeId.toString()
        );
        if (employeeProfile?.profile) {
          employeeName = `${employeeProfile.profile.firstName || ''} ${employeeProfile.profile.lastName || ''}`.trim();
          employeeDepartment = employeeProfile.profile.department || 'N/A';
        }
      } catch (error) {
        console.warn(`Could not retrieve employee profile: ${error.message}`);
      }

      // Send notification when equipment is marked as returned
      if (returned && !previousStatus) {
        const equipmentReturnNotificationPayload = {
          // recipientId should be HR/system admins
          recipientId: [terminationRequest.employeeId], // TODO: Replace with actual HR/admin IDs
          type: 'Info',
          deliveryType: 'MULTICAST',
          title: `Equipment Returned: ${equipmentName}`,
          message: `Equipment has been marked as returned for ${employeeName}.

Employee Details:
- Name: ${employeeName}
- Employee ID: ${terminationRequest.employeeId.toString().slice(-8)}
- Department: ${employeeDepartment}

Equipment Returned:
- Item: ${equipmentName}
${equipmentItem.condition ? `- Condition: ${equipmentItem.condition}` : ''}

Equipment Progress:
- Total Items: ${clearanceChecklist.equipmentList.length}
- Returned: ${clearanceChecklist.equipmentList.filter(item => item.returned).length}
- Pending: ${clearanceChecklist.equipmentList.filter(item => !item.returned).length}

${allEquipmentReturned ? '✓ All equipment has been returned!' : 'Still awaiting return of remaining equipment.'}`,
          relatedEntityId: clearanceChecklist._id.toString(),
          relatedModule: 'Recruitment',
          isRead: false,
        };

        await this.notificationService.create(equipmentReturnNotificationPayload as any);
        console.log(`Equipment return notification sent for ${equipmentName}`);
      }

      // Send notification to employee
      const employeeNotificationPayload = {
        recipientId: [terminationRequest.employeeId],
        type: 'Info',
        deliveryType: 'UNICAST',
        title: `Equipment Status Update: ${equipmentName}`,
        message: `Your equipment "${equipmentName}" has been marked as ${returned ? 'returned' : 'pending return'}.

Equipment Progress:
- Total Items: ${clearanceChecklist.equipmentList.length}
- Returned: ${clearanceChecklist.equipmentList.filter(item => item.returned).length}
- Pending: ${clearanceChecklist.equipmentList.filter(item => !item.returned).length}

${allEquipmentReturned ? 'All equipment has been returned! Thank you.' : 'Please ensure all remaining equipment is returned before your last working day.'}`,
        relatedEntityId: clearanceChecklist._id.toString(),
        relatedModule: 'Recruitment',
        isRead: false,
      };

      await this.notificationService.create(employeeNotificationPayload as any);
      console.log(`Employee notification sent for equipment update`);
    }

    // Check if all clearance requirements are met and auto-approve termination
    await this.checkAndAutoApproveTermination(clearanceChecklistId);

    return {
      message: `Equipment "${equipmentName}" return status updated successfully`,
      clearanceChecklistId: clearanceChecklist._id.toString(),
      equipmentName: equipmentName,
      returned: returned,
      allEquipmentReturned: allEquipmentReturned,
    };
  }

  //Update access card return status in clearance checklist
  async updateAccessCardReturnStatus(
    clearanceChecklistId: string,
    cardReturned: boolean,
  ): Promise<{
    message: string;
    clearanceChecklistId: string;
    cardReturned: boolean;
  }> {
    console.log(`Updating access card return status to ${cardReturned} in checklist ${clearanceChecklistId}`);

    const checklistObjectId = new Types.ObjectId(clearanceChecklistId);

    const clearanceChecklist = await this.clearanceChecklistRepository
      .findById(checklistObjectId.toString());

    if (!clearanceChecklist) {
      console.error(`Clearance checklist with ID ${clearanceChecklistId} not found`);
      throw new NotFoundException(`Clearance checklist with ID ${clearanceChecklistId} not found`);
    }

    const previousStatus = clearanceChecklist.cardReturned;
    clearanceChecklist.cardReturned = cardReturned;

    await this.clearanceChecklistRepository.updateById(checklistObjectId.toString(), clearanceChecklist);

    console.log(`Access card return status updated from ${previousStatus} to ${cardReturned}`);

    // Get termination request for employee information and notifications
    const terminationRequest = await this.terminationRequestRepository
      .findById(clearanceChecklist.terminationId.toString());

    if (terminationRequest) {
      // Retrieve employee profile for name
      let employeeName = 'Employee';
      let employeeDepartment = 'N/A';
      try {
        const employeeProfile = await this.employeeService.getProfile(
          terminationRequest.employeeId.toString()
        );
        if (employeeProfile?.profile) {
          employeeName = `${employeeProfile.profile.firstName || ''} ${employeeProfile.profile.lastName || ''}`.trim();
          employeeDepartment = employeeProfile.profile.department || 'N/A';
        }
      } catch (error) {
        console.warn(`Could not retrieve employee profile: ${error.message}`);
      }

      // Send notification when card is marked as returned
      if (cardReturned && !previousStatus) {
        const cardReturnNotificationPayload = {
          recipientId: [terminationRequest.employeeId], // TODO: Replace with actual HR/admin IDs
          type: 'Info',
          deliveryType: 'MULTICAST',
          title: `Access Card Returned`,
          message: `Access card has been marked as returned for ${employeeName}.

Employee Details:
- Name: ${employeeName}
- Employee ID: ${terminationRequest.employeeId.toString().slice(-8)}
- Department: ${employeeDepartment}

Access card has been successfully collected and can be deactivated.`,
          relatedEntityId: clearanceChecklist._id.toString(),
          relatedModule: 'Recruitment',
          isRead: false,
        };

        await this.notificationService.create(cardReturnNotificationPayload as any);
        console.log(`Access card return notification sent`);
      }

      // Send notification to employee
      const employeeNotificationPayload = {
        recipientId: [terminationRequest.employeeId],
        type: 'Info',
        deliveryType: 'UNICAST',
        title: `Access Card Status Update`,
        message: `Your access card has been marked as ${cardReturned ? 'returned' : 'pending return'}.

${cardReturned ? 'Thank you for returning your access card.' : 'Please ensure your access card is returned before your last working day.'}`,
        relatedEntityId: clearanceChecklist._id.toString(),
        relatedModule: 'Recruitment',
        isRead: false,
      };

      await this.notificationService.create(employeeNotificationPayload as any);
      console.log(`Employee notification sent for access card update`);
    }

    // Check if all clearance requirements are met and auto-approve termination
    await this.checkAndAutoApproveTermination(clearanceChecklistId);

    return {
      message: `Access card return status updated successfully`,
      clearanceChecklistId: clearanceChecklist._id.toString(),
      cardReturned: cardReturned,
    };
  }

  // Helper method to check if all clearance requirements are met and auto-approve termination
  private async checkAndAutoApproveTermination(clearanceChecklistId: string): Promise<void> {
    try {
      console.log(`Checking if termination can be auto-approved for checklist ${clearanceChecklistId}`);

      const clearanceChecklist = await this.clearanceChecklistRepository.findById(clearanceChecklistId);
      if (!clearanceChecklist) {
        console.log(`Clearance checklist ${clearanceChecklistId} not found`);
        return;
      }

      // Get the termination request
      const terminationRequest = await this.terminationRequestRepository.findById(
        clearanceChecklist.terminationId.toString()
      );

      if (!terminationRequest) {
        console.log(`Termination request not found for checklist ${clearanceChecklistId}`);
        return;
      }

      // Skip if already approved
      if (terminationRequest.status === TerminationStatus.APPROVED) {
        console.log(`Termination ${terminationRequest._id} is already approved`);
        return;
      }

      // Check all requirements
      const allDepartmentsApproved = clearanceChecklist.items.every(
        (item) => item.status === ApprovalStatus.APPROVED
      );

      const allEquipmentReturned = clearanceChecklist.equipmentList.every(
        (equipment) => equipment.returned === true
      );

      const cardReturned = clearanceChecklist.cardReturned === true;

      console.log(`Auto-approval check for termination ${terminationRequest._id}:
        - All departments approved: ${allDepartmentsApproved}
        - All equipment returned: ${allEquipmentReturned}
        - Card returned: ${cardReturned}`);

      // If all requirements are met, auto-approve the termination
      if (allDepartmentsApproved && allEquipmentReturned && cardReturned) {
        console.log(`All clearance requirements met. Auto-approving termination ${terminationRequest._id}`);

        terminationRequest.status = TerminationStatus.APPROVED;
        terminationRequest.hrComments = 'Auto-approved: All clearance requirements completed (departments approved, equipment returned, access card returned)';

        await this.terminationRequestRepository.updateById(
          terminationRequest._id.toString(),
          terminationRequest
        );

        console.log(`✓ Termination ${terminationRequest._id} auto-approved successfully. Employee is now ready for system access revocation.`);

        // Send notification to system admin
        try {
          const employeeProfile = await this.employeeService.getProfile(
            terminationRequest.employeeId.toString()
          );
          const employeeName = employeeProfile?.profile
            ? `${employeeProfile.profile.firstName} ${employeeProfile.profile.lastName}`
            : 'Employee';

          const autoApprovalNotification = {
            recipientId: [terminationRequest.employeeId],
            type: 'Alert',
            deliveryType: 'MULTICAST',
            title: `Termination Auto-Approved: ${employeeName} Ready for Access Revocation`,
            message: `The termination request for ${employeeName} has been automatically approved after all clearance requirements were completed.

Employee Details:
- Name: ${employeeName}
- Employee ID: ${terminationRequest.employeeId.toString().slice(-8)}
- Termination Date: ${terminationRequest.terminationDate ? new Date(terminationRequest.terminationDate).toLocaleDateString() : 'TBD'}

Clearance Status:
✓ All ${clearanceChecklist.items.length} departments approved
✓ All ${clearanceChecklist.equipmentList.length} equipment items returned
✓ Access card returned

ACTION REQUIRED:
The employee is now ready for system access revocation. Please navigate to System Admin → Access Revocation to manually revoke their system access.`,
            relatedEntityId: terminationRequest._id.toString(),
            relatedModule: 'Recruitment',
            isRead: false,
          };

          await this.notificationService.create(autoApprovalNotification as any);
          console.log(`Auto-approval notification sent to system admin for ${employeeName}`);
        } catch (error) {
          console.warn(`Could not send auto-approval notification: ${error.message}`);
        }
      } else {
        console.log(`Not all requirements met yet. Termination ${terminationRequest._id} remains in ${terminationRequest.status} status.`);
      }
    } catch (error) {
      console.error(`Error in checkAndAutoApproveTermination: ${error.message}`);
      // Don't throw - this is a background check that shouldn't fail the main operation
    }
  }

  //OFF-020
  //Approve or reject termination request
  async approveTermination(dto: ApproveTerminationDto): Promise<TerminationRequest> {
    console.log(`Updating termination request ${dto.terminationRequestId} to status ${dto.status}`);

    const terminationObjectId = new Types.ObjectId(dto.terminationRequestId);

    const terminationRequest = await this.terminationRequestRepository
      .findById(terminationObjectId.toString());

    if (!terminationRequest) {
      console.error(`Termination request with ID ${dto.terminationRequestId} not found`);
      throw new NotFoundException(`Termination request with ID ${dto.terminationRequestId} not found`);
    }

    // If approving termination, validate clearance checklist requirements
    if (dto.status === TerminationStatus.APPROVED) {
      console.log(`Validating clearance checklist for termination approval ${dto.terminationRequestId}`);

      const clearanceChecklist = await this.clearanceChecklistRepository
        .findByTerminationId(terminationObjectId);

      if (!clearanceChecklist) {
        console.error(`Clearance checklist not found for termination ${dto.terminationRequestId}`);
        throw new BadRequestException(
          `Cannot approve termination: Clearance checklist must be created first for termination request ${dto.terminationRequestId}`
        );
      }

      // Check if access card has been returned
      if (!clearanceChecklist.cardReturned) {
        console.error(`Access card not returned for termination ${dto.terminationRequestId}`);
        throw new BadRequestException(
          `Cannot approve termination: Employee access card has not been returned. Please ensure cardReturned is marked as true.`
        );
      }

      // Check all departments have approved
      const allDepartmentsApproved = clearanceChecklist.items.every(
        (item) => item.status === ApprovalStatus.APPROVED
      );

      if (!allDepartmentsApproved) {
        const pendingDepartments = clearanceChecklist.items
          .filter((item) => item.status !== ApprovalStatus.APPROVED)
          .map((item) => `${item.department} (${item.status})`)
          .join(', ');

        console.error(`Not all departments approved for termination ${dto.terminationRequestId}: ${pendingDepartments}`);
        throw new BadRequestException(
          `Cannot approve termination: The following departments have not approved clearance: ${pendingDepartments}. All departments must approve before termination can be finalized.`
        );
      }

      // Check all equipment has been returned
      const allEquipmentReturned = clearanceChecklist.equipmentList.every(
        (equipment) => equipment.returned === true
      );

      if (!allEquipmentReturned) {
        const unreturned = clearanceChecklist.equipmentList
          .filter((equipment) => !equipment.returned)
          .map((equipment) => equipment.name)
          .join(', ');

        console.error(`Equipment not returned for termination ${dto.terminationRequestId}: ${unreturned}`);
        throw new BadRequestException(
          `Cannot approve termination: The following equipment has not been returned: ${unreturned}. All company property must be returned before approval.`
        );
      }

      console.log(`All clearance requirements met for termination ${dto.terminationRequestId}`);
    }

    const previousStatus = terminationRequest.status;

    terminationRequest.status = dto.status;

    if (dto.hrComments) {
      terminationRequest.hrComments = dto.hrComments;
    }

    await this.terminationRequestRepository.updateById(terminationObjectId.toString(), terminationRequest);

    console.log(`Termination request ${dto.terminationRequestId} status updated from ${previousStatus} to ${dto.status}`);

    return terminationRequest;
  }


  async getDepartmentHeadId(department: string): Promise<Types.ObjectId | null> {
    try {
      const departmentHead = await this.organizationStructureService.findDepartmentHead(department);

      if (departmentHead && departmentHead.id) {
        console.log(`Found department head for ${department}: ${departmentHead.employeeNumber}`);
        return new Types.ObjectId(departmentHead.id);
      }

      return null;
    } catch (error) {
      console.error(`Error finding department head for ${department}:`, error.message);
      return null;
    }
  }

  async getDepartmentChecklistItems(department: string): Promise<string> {
    const checklistMap = {
      IT: `- Laptop and equipment returned
- System access credentials collected
- Software licenses revoked
- Email account disabled`,
      Finance: `- Outstanding expenses cleared
- Company credit cards returned
- Financial obligations settled
- Petty cash returned`,
      Facilities: `- Office keys and access cards returned
- Parking pass surrendered
- Workspace cleared and inspected
- Company property returned`,
      HR: `- Exit interview completed
- Final documents signed
- Personal files updated
- Employee handbook returned`,
    };

    return checklistMap[department] || `- Standard clearance items
- All department obligations cleared`;
  }

  async getAllOffboardingChecklists() {
    try {
      const checklists = await this.clearanceChecklistRepository.find({});

      const enrichedChecklists = await Promise.all(
        checklists.map(async (checklist) => {
          const termination = await this.terminationRequestRepository.findById(
            checklist.terminationId.toString()
          );

          let employeeData: any = null;
          if (termination && termination.employeeId) {
            try {
              const empProfile = await this.employeeService.getProfile(
                termination.employeeId.toString()
              );
              employeeData = empProfile?.profile || null;
            } catch (error) {
              console.error('Error fetching employee:', error);
            }
          }

          const totalClearances = checklist.items?.length || 0;
          const clearedCount = checklist.items?.filter(
            (item: any) => item.status === 'approved'
          ).length || 0;
          const progressPercent = totalClearances > 0 ? Math.round((clearedCount / totalClearances) * 100) : 0;

          return {
            checklist,
            termination,
            employee: employeeData,
            progress: {
              totalClearances,
              clearedCount,
              progress: progressPercent,
              allCleared: clearedCount === totalClearances && totalClearances > 0,
            },
          };
        })
      );

      return {
        success: true,
        total: enrichedChecklists.length,
        checklists: enrichedChecklists,
      };
    } catch (error) {
      console.error('Error fetching offboarding checklists:', error);
      throw error;
    }
  }

  async getAllTerminationRequests(): Promise<TerminationRequest[]> {
    try {
      console.log('Fetching all termination requests');
      const terminationRequests = await this.terminationRequestRepository.find({});
      console.log(`Found ${terminationRequests.length} termination request(s)`);
      return terminationRequests;
    } catch (error) {
      console.error('Error fetching termination requests:', error);
      throw error;
    }
  }

  // Get employees ready for system access revocation
  // Only returns employees who have completed ALL clearance requirements:
  // - All departments approved
  // - All equipment returned
  // - Access card returned
  // - Employee status is NOT already TERMINATED
  //OFF-021
  // Send manual reminder for pending clearances
  async sendOffboardingReminder(terminationRequestId: string): Promise<{
    message: string;
    remindersSent: number;
    pendingDepartments: string[];
    unreturnedItems: string[];
  }> {
    console.log(`Sending offboarding reminder for termination request ${terminationRequestId}`);

    const terminationObjectId = new Types.ObjectId(terminationRequestId);
    const terminationRequest = await this.terminationRequestRepository.findById(terminationObjectId.toString());

    if (!terminationRequest) {
      throw new NotFoundException(`Termination request with ID ${terminationRequestId} not found`);
    }

    // Get clearance checklist
    const checklist = await this.clearanceChecklistRepository.findByTerminationId(terminationObjectId);
    if (!checklist) {
      throw new BadRequestException(`No offboarding checklist found for termination ${terminationRequestId}`);
    }

    // Get employee details
    const employee = await this.employeeService.getProfile(terminationRequest.employeeId.toString());
    const employeeNumber = employee?.profile?.employeeNumber || 'N/A';
    const employeeName = employee?.profile 
      ? `${employee.profile.firstName} ${employee.profile.lastName}` 
      : 'Employee';

    // Identify pending departments
    const pendingDepartments = checklist.items
      .filter(item => item.status !== ApprovalStatus.APPROVED)
      .map(item => item.department);

    // Identify unreturned equipment
    const unreturnedEquipment = checklist.equipmentList
      .filter(eq => !eq.returned)
      .map(eq => eq.name);

    const cardNotReturned = !checklist.cardReturned;

    if (pendingDepartments.length === 0 && unreturnedEquipment.length === 0 && !cardNotReturned) {
      return {
        message: 'All clearances completed. No reminders needed.',
        remindersSent: 0,
        pendingDepartments: [],
        unreturnedItems: [],
      };
    }

    let remindersSent = 0;

    // Send reminders to pending departments only
    console.log(`Sending reminders to ${pendingDepartments.length} pending department(s)...`);
    
    for (const department of pendingDepartments) {
      try {
        const departmentHeadId = await this.getDepartmentHeadId(department);
        const recipients = departmentHeadId 
          ? [departmentHeadId.toString()] 
          : [terminationRequest.employeeId.toString()];

        console.log(`Sending reminder to ${department}. Recipients:`, recipients);

        const notificationPayload = {
          recipientId: recipients,
          type: 'Alert',
          deliveryType: departmentHeadId ? 'UNICAST' : 'MULTICAST',
          title: `Reminder: Pending Clearance for ${employeeNumber}`,
          message: `This is a reminder that your department has pending clearance items for employee ${employeeNumber} (${employeeName}).

Department: ${department}
Status: Pending Approval
Termination Date: ${terminationRequest.terminationDate ? new Date(terminationRequest.terminationDate).toLocaleDateString() : 'TBD'}

Pending Items:
${pendingDepartments.length > 0 ? `- Departments: ${pendingDepartments.join(', ')}` : ''}
${unreturnedEquipment.length > 0 ? `- Unreturned Equipment: ${unreturnedEquipment.join(', ')}` : ''}
${cardNotReturned ? '- Access Card: Not returned' : ''}

Please complete the clearance process as soon as possible.`,
          relatedModule: 'Recruitment',
          isRead: false,
        };

        await this.notificationService.create(notificationPayload);

        remindersSent++;
        console.log(`✓ Reminder sent successfully to ${department} department${departmentHeadId ? ' head' : ' (general)'}`);
      } catch (error) {
        console.error(`✗ Failed to send reminder to ${department}:`, error.message);
        console.error('Error details:', error);
      }
    }

    console.log(`Completed sending ${remindersSent} reminder(s)`);

    return {
      message: `Reminders sent successfully to ${remindersSent} department(s)`,
      remindersSent,
      pendingDepartments,
      unreturnedItems: [...unreturnedEquipment, ...(cardNotReturned ? ['Access Card'] : [])],
    };
  }

  //OFF-022
  // Check and send pre-expiry/expiry warnings (to be called by cron job or manually)
  async checkAndSendExpiryWarnings(): Promise<{
    preExpiryWarnings: number;
    expiryWarnings: number;
  }> {
    console.log('Checking for termination expiry warnings...');

    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // Find all approved AND pending termination requests with termination dates
    const allTerminations = await this.terminationRequestRepository.find({
      status: { $in: [TerminationStatus.APPROVED, TerminationStatus.PENDING] },
      terminationDate: { $exists: true, $ne: null },
    });

    let preExpiryWarnings = 0;
    let expiryWarnings = 0;

    for (const termination of allTerminations) {
      if (!termination.terminationDate) continue;

      const terminationDate = new Date(termination.terminationDate);
      const checklist = await this.clearanceChecklistRepository.findOne({
        terminationId: termination._id,
      });

      if (!checklist) continue;

      // Check if all clearances are complete
      const allDepartmentsApproved = checklist.items.every(
        (item) => item.status === ApprovalStatus.APPROVED
      );
      const allEquipmentReturned = checklist.equipmentList.every((eq) => eq.returned);
      const cardReturned = checklist.cardReturned;

      const allComplete = allDepartmentsApproved && allEquipmentReturned && cardReturned;

      // Get employee details
      const employee = await this.employeeService.getProfile(termination.employeeId.toString());
      const employeeNumber = employee?.profile?.employeeNumber || 'N/A';

      // Case 1: Termination date expired
      if (terminationDate < now && !allComplete) {
        const pendingDepartments = checklist.items
          .filter((item) => item.status !== ApprovalStatus.APPROVED)
          .map((item) => item.department);
        const unreturnedItems = checklist.equipmentList
          .filter((eq) => !eq.returned)
          .map((eq) => eq.name);

        // Send to ALL department heads + system admin
        const allDepartments = [
          'Health Insurance',
          'Inventory',
          'Library',
          'Post Grad Studies',
          'Finance',
          'IT Equipment',
          'HR'
        ];

        for (const dept of allDepartments) {
          try {
            const departmentHeadId = await this.getDepartmentHeadId(dept);
            const recipients = departmentHeadId 
              ? [departmentHeadId.toString()] 
              : [termination.employeeId.toString()];

            const isPending = termination.status === TerminationStatus.PENDING;
            const statusWarning = isPending 
              ? 'The termination request is still PENDING approval, but the termination date has expired.' 
              : '';

            const notificationPayload = {
              recipientId: recipients,
              type: 'Alert',
              deliveryType: departmentHeadId ? 'UNICAST' : 'MULTICAST',
              title: `URGENT: Termination Date Expired - ${employeeNumber}`,
              message: `CRITICAL ALERT: The termination date for employee ${employeeNumber} has passed, but clearances are incomplete.

Termination Status: ${termination.status}
Termination Date: ${terminationDate.toLocaleDateString()} (EXPIRED)
Days Overdue: ${Math.floor((now.getTime() - terminationDate.getTime()) / (1000 * 60 * 60 * 24))} days

${statusWarning}

Pending Items:
${pendingDepartments.length > 0 ? `- Departments: ${pendingDepartments.join(', ')}` : ''}
${unreturnedItems.length > 0 ? `- Equipment: ${unreturnedItems.join(', ')}` : ''}
${!cardReturned ? '- Access Card: Not returned' : ''}

ACTION REQUIRED:
The offboarding checklist was not completed before the termination date. This employee is now listed for system access revocation.

Department: ${dept}
Please complete your clearance items immediately, or contact System Administrator for access revocation.`,
              relatedModule: 'Recruitment',
              isRead: false,
            };

            await this.notificationService.create(notificationPayload);

            expiryWarnings++;
          } catch (error) {
            console.error(`Failed to send expiry warning to ${dept}:`, error.message);
          }
        }
      }
      // Case 2: Termination date in 2 days
      else if (terminationDate <= twoDaysFromNow && terminationDate > now && !allComplete) {
        const pendingDepartments = checklist.items
          .filter((item) => item.status !== ApprovalStatus.APPROVED)
          .map((item) => item.department);
        const unreturnedItems = checklist.equipmentList
          .filter((eq) => !eq.returned)
          .map((eq) => eq.name);

        // Send only to pending departments
        for (const dept of pendingDepartments) {
          try {
            const departmentHeadId = await this.getDepartmentHeadId(dept);
            const recipients = departmentHeadId 
              ? [departmentHeadId.toString()] 
              : [termination.employeeId.toString()];

            const notificationPayload = {
              recipientId: recipients,
              type: 'Alert',
              deliveryType: departmentHeadId ? 'UNICAST' : 'MULTICAST',
              title: `Urgent: Termination Deadline Approaching - ${employeeNumber}`,
              message: `URGENT: The termination date for employee ${employeeNumber} is approaching in 2 days.

Termination Date: ${terminationDate.toLocaleDateString()}
Days Remaining: ${Math.ceil((terminationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days

Pending Items:
${pendingDepartments.length > 0 ? `- Departments: ${pendingDepartments.join(', ')}` : ''}
${unreturnedItems.length > 0 ? `- Equipment: ${unreturnedItems.join(', ')}` : ''}
${!cardReturned ? '- Access Card: Not returned' : ''}

Department: ${dept}
Please complete your clearance items before the termination date to avoid delays.`,
              relatedModule: 'Recruitment',
              isRead: false,
            };

            await this.notificationService.create(notificationPayload);

            preExpiryWarnings++;
          } catch (error) {
            console.error(`Failed to send pre-expiry warning to ${dept}:`, error.message);
          }
        }
      }
    }

    console.log(`Expiry warnings sent: ${preExpiryWarnings} pre-expiry, ${expiryWarnings} expiry`);
    return { preExpiryWarnings, expiryWarnings };
  }

  async getEmployeesReadyForRevocation(): Promise<any[]> {
    try {
      console.log('Fetching employees ready for system access revocation');

      // Find all termination requests that are approved OR pending with expired dates
      const now = new Date();
      const terminationRequests = await this.terminationRequestRepository.find({
        status: { $in: [TerminationStatus.APPROVED, TerminationStatus.PENDING] },
      });

      console.log(`Found ${terminationRequests.length} approved termination request(s)`);

      const readyForRevocation: any[] = [];

      for (const terminationRequest of terminationRequests) {
        // Get employee details
        let employee;
        try {
          employee = await this.employeeService.getProfile(
            terminationRequest.employeeId.toString()
          );
        } catch (error) {
          console.log(`Employee ${terminationRequest.employeeId} not found - skipping`);
          continue;
        }

        // Skip if employee is already terminated
        if (!employee || !employee.profile || employee.profile.status === EmployeeStatus.TERMINATED) {
          console.log(`Skipping employee ${terminationRequest.employeeId} - already terminated or not found`);
          continue;
        }

        // Find the clearance checklist for this termination
        const clearanceChecklist = await this.clearanceChecklistRepository.findOne({
          terminationId: terminationRequest._id,
        });

        if (!clearanceChecklist) {
          console.log(`No clearance checklist found for termination ${terminationRequest._id}`);
          continue;
        }

        // Check if termination date has expired
        const terminationDate = terminationRequest.terminationDate 
          ? new Date(terminationRequest.terminationDate) 
          : null;
        const isExpired = terminationDate && terminationDate < now;

        // Check if all departments have approved
        const allDepartmentsApproved = clearanceChecklist.items.every(
          (item) => item.status === ApprovalStatus.APPROVED
        );

        // Check if all equipment has been returned
        const allEquipmentReturned = clearanceChecklist.equipmentList.every(
          (equipment) => equipment.returned === true
        );

        // Check if access card has been returned
        const cardReturned = clearanceChecklist.cardReturned;

        // Include employee if:
        // 1. All clearances complete (original logic) OR
        // 2. Termination date expired and status is PENDING (new logic)
        const allClearancesComplete = allDepartmentsApproved && allEquipmentReturned && cardReturned;
        const isPendingExpired = terminationRequest.status === TerminationStatus.PENDING && isExpired;

        if (!allClearancesComplete && !isPendingExpired) {
          console.log(`Employee ${terminationRequest.employeeId} not ready - clearances incomplete and not expired`);
          continue;
        }

        // All requirements met - add to ready list
        const reason = allClearancesComplete 
          ? 'All clearances completed' 
          : 'Termination date expired (pending status)';
        console.log(`Employee ${terminationRequest.employeeId} is ready for revocation - ${reason}`);

        readyForRevocation.push({
          terminationRequest: terminationRequest,
          employee: employee.profile,
          clearanceChecklist: clearanceChecklist,
          readyForRevocation: true,
          allDepartmentsApproved: allDepartmentsApproved,
          allEquipmentReturned: allEquipmentReturned,
          cardReturned: clearanceChecklist.cardReturned,
          isExpired: isExpired || false,
          isPendingExpired: isPendingExpired || false,
          revocationReason: reason,
        });
      }

      console.log(`${readyForRevocation.length} employee(s) ready for system access revocation`);
      return readyForRevocation;
    } catch (error) {
      console.error('Error fetching employees ready for revocation:', error);
      throw error;
    }
  }
}
