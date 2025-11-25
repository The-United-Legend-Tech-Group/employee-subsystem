import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateEmployeeProfileDto {
    @IsOptional()
    @IsString()
    biography?: string;

    @IsOptional()
    @IsString()
    @IsUrl()
    profilePictureUrl?: string;
}
