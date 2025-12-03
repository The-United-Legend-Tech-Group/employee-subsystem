import { IsNotEmpty, IsString, IsOptional, IsDateString, IsArray, IsMongoId } from 'class-validator';

export class CreateOfferDto {
    @IsNotEmpty()
    @IsMongoId()
    applicationId: string;

    @IsNotEmpty()
    @IsMongoId()
    candidateId: string;

    @IsNotEmpty()
    @IsMongoId()
    hrEmployeeId: string;

    @IsNotEmpty()
    @IsString()
    role: string; // Position name - will be used to lookup signing bonus and gross salary

    @IsOptional()
    @IsArray()
    benefits?: string[];

    @IsOptional()
    @IsString()
    conditions?: string;

    @IsOptional()
    @IsString()
    insurances?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsDateString()
    deadline?: string;
}
