import { IsArray, IsOptional, IsString } from 'class-validator';
import { SystemRole } from '../enums/employee-profile.enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignRolesDto {
  @ApiPropertyOptional({ enum: SystemRole, isArray: true })
  @IsOptional()
  @IsArray()
  roles?: SystemRole[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
