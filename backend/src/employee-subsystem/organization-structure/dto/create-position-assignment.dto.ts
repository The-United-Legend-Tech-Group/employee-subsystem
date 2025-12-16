import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePositionAssignmentDto {
    @ApiProperty({ description: 'The ID of the employee to assign' })
    @IsString()
    @IsNotEmpty()
    employeeId: string;

    @ApiProperty({ description: 'Reason for the assignment change (optional)', required: false })
    @IsString()
    @IsOptional()
    reason?: string;

    @ApiProperty({ description: 'The ID of the change request associated with this assignment (optional)', required: false })
    @IsString()
    @IsOptional()
    changeRequestId?: string;

    @ApiProperty({ description: 'The ID of the position to assign the employee to' })
    @IsString()
    @IsNotEmpty()
    positionId: string;

    @ApiProperty({ description: 'Start date of the assignment' })
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @ApiProperty({ description: 'End date of the assignment (optional)', required: false })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}
