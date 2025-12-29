import { IsNotEmpty, IsString, IsOptional, IsDateString, IsArray, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOfferDto {
    @ApiProperty({
        description: 'MongoDB ObjectId of the application',
        example: '507f1f77bcf86cd799439011'
    })
    @IsNotEmpty()
    @IsMongoId()
    applicationId: string;

    @ApiProperty({
        description: 'MongoDB ObjectId of the candidate',
        example: '507f1f77bcf86cd799439012'
    })
    @IsNotEmpty()
    @IsMongoId()
    candidateId: string;

    @ApiPropertyOptional({
        description: 'MongoDB ObjectId of the HR employee creating the offer. If not provided, will be derived from auth token.',
        example: '507f1f77bcf86cd799439013'
    })
    @IsOptional()
    @IsMongoId()
    hrEmployeeId?: string;

    @ApiProperty({
        description: 'Position name - will be used to lookup signing bonus and gross salary from payroll configuration',
        example: 'Senior Software Engineer'
    })
    @IsNotEmpty()
    @IsString()
    role: string;

    @ApiPropertyOptional({
        description: 'List of benefits included in the offer',
        example: ['Health Insurance', 'Annual Leave', 'Performance Bonus'],
        type: [String]
    })
    @IsOptional()
    @IsArray()
    benefits?: string[];

    @ApiPropertyOptional({
        description: 'Employment conditions',
        example: 'Full-time position, 40 hours per week, flexible working hours'
    })
    @IsOptional()
    @IsString()
    conditions?: string;

    @ApiPropertyOptional({
        description: 'Insurance details',
        example: 'Medical, dental, and vision insurance covered'
    })
    @IsOptional()
    @IsString()
    insurances?: string;

    @ApiPropertyOptional({
        description: 'Full offer letter content',
        example: 'We are pleased to offer you the position of Senior Software Engineer...'
    })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional({
        description: 'Deadline for candidate to respond (ISO date string)',
        example: '2025-12-25T23:59:59.000Z'
    })
    @IsOptional()
    @IsDateString()
    deadline?: string;
}
