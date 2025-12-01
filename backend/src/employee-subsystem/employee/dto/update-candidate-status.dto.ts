import { IsEnum, IsNotEmpty } from 'class-validator';
import { CandidateStatus } from '../enums/employee-profile.enums';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCandidateStatusDto {
    @ApiProperty({ enum: CandidateStatus })
    @IsNotEmpty()
    @IsEnum(CandidateStatus)
    status: CandidateStatus;
}
