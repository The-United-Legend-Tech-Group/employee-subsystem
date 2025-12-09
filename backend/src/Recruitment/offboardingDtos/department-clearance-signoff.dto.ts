import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApprovalStatus } from '../enums/approval-status.enum';
export class DepartmentClearanceSignOffDto {
  @IsMongoId({
    message: 'Clearance checklist ID must be a valid MongoDB ObjectId',
  })
  @IsNotEmpty({ message: 'Clearance checklist ID is required' })
  clearanceChecklistId: string;
  @IsString({ message: 'Department name must be a string' })
  @IsNotEmpty({ message: 'Department name is required' })
  department: string;
  @IsEnum(ApprovalStatus, {
    message: 'Status must be one of: approved, rejected, or pending',
  })
  @IsNotEmpty({ message: 'Approval status is required' })
  status: ApprovalStatus;
  @IsMongoId({ message: 'Approver ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Approver ID is required' })
  approverId: string;
  @IsOptional()
  @IsString({ message: 'Comments must be a string' })
  comments?: string;
}
