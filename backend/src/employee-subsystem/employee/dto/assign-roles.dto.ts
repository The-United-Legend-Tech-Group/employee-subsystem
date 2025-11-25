import { IsArray, IsOptional, IsString } from 'class-validator';
import { SystemRole } from '../enums/employee-profile.enums';

export class AssignRolesDto {
  @IsOptional()
  @IsArray()
  roles?: SystemRole[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
