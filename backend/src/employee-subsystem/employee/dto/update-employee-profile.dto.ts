import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmployeeProfileDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    biography?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsUrl()
    profilePictureUrl?: string;
}
