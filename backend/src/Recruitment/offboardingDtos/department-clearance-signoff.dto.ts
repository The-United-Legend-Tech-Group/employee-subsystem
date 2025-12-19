import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class DepartmentClearanceSignOffDto {
  @IsMongoId({
    message: 'Clearance checklist ID must be a valid MongoDB ObjectId',
  })
  @IsNotEmpty({ message: 'Clearance checklist ID is required' })
  clearanceChecklistId: string;
  @IsString({ message: 'Department name must be a string' })
  @IsNotEmpty({ message: 'Department name is required' })
  department: string;
  @IsIn(['approved', 'rejected', 'pending', 'under_review'], {
    message: 'Status must be one of: approved, rejected, pending, or under_review',
  })
  @IsNotEmpty({ message: 'Approval status is required' })
  status: string; // Accepts TerminationStatus enum values
  @IsOptional()
  @IsMongoId({ message: 'Approver ID must be a valid MongoDB ObjectId' })
  approverId?: string;
  @IsOptional()
  @IsString({ message: 'Comments must be a string' })
  comments?: string;
}
