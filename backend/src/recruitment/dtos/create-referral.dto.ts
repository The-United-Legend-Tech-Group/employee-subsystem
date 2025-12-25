import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReferralDto {
    @ApiProperty({
        description: 'Referring employee MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011'
    })
    @IsNotEmpty()
    @IsMongoId()
    referringEmployeeId: string;

    @ApiProperty({
        description: 'Candidate MongoDB ObjectId',
        example: '507f1f77bcf86cd799439012'
    })
    @IsNotEmpty()
    @IsMongoId()
    candidateId: string;

    @ApiProperty({
        description: 'Role for the referral',
        example: 'Software Engineer',
        required: false
    })
    @IsNotEmpty()
    @IsString()
    role?: string;

    @ApiProperty({
        description: 'Level for the referral',
        example: 'Senior',
        required: false
    })
    @IsOptional()
    @IsString()
    level?: string;
}