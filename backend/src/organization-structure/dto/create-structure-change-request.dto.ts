import { StructureRequestType } from '../enums/organization-structure.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateStructureChangeRequestDto {
  @IsString()
  @ApiProperty({ description: 'Employee id who requested the change' })
  requestedByEmployeeId: string;

  @IsEnum(StructureRequestType)
  @ApiProperty({
    description: 'Type of structure change request',
    enum: StructureRequestType,
  })
  requestType: StructureRequestType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Target department id (if applicable)' })
  targetDepartmentId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Target position id (if applicable)' })
  targetPositionId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Details of the change request' })
  details?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Reason for the change request' })
  reason?: string;

  // optional field in case submitter differs from requester
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Employee id who submitted the request (may differ from requester)',
  })
  submittedByEmployeeId?: string;
}
