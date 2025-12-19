import { IsMongoId, IsOptional, IsString  } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FilterLeaveRequestsByTypeDto {
  @ApiProperty({
    description: 'Leave type ID to filter by',
  })
  @IsMongoId()
  leaveTypeId: string;

  @ApiPropertyOptional({
    description: 'Filter by approval flow status (e.g., "approved", "rejected", "pending")',
  })
  @IsOptional()
  @IsString()
  approvalFlowStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter by approval flow role (e.g., "department head", "hr")',
  })
  @IsOptional()
  @IsString()
  approvalFlowRole?: string;
}

