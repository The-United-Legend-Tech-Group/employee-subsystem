import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

export class AdminUpdateEmployeeProfileDto extends PartialType(CreateEmployeeDto) {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsUrl()
    profilePictureUrl?: string;
}
