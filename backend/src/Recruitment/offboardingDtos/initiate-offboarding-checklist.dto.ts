
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';


export class DepartmentApprovalItemDto {
  @IsString({ message: 'Department name must be a string' })
  @IsNotEmpty({ message: 'Department name is required' })
  department: string;
  @IsOptional()
  @IsString({ message: 'Comments must be a string' })
  comments?: string;
}

export class EquipmentItemDto {

  @IsMongoId({ message: 'Equipment ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Equipment ID is required' })
  equipmentId: string;

  @IsString({ message: 'Equipment name must be a string' })
  @IsNotEmpty({ message: 'Equipment name is required' })
  name: string;

  @IsBoolean({ message: 'Returned status must be a boolean' })
  @IsNotEmpty({ message: 'Returned status is required' })
  returned: boolean;

  @IsOptional()
  @IsString({ message: 'Condition must be a string' })
  condition?: string;
}


export class InitiateOffboardingChecklistDto {

  @IsMongoId({ message: 'Termination ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Termination ID is required' })
  terminationId: string;

  @IsArray({ message: 'Department items must be an array' })
  @ValidateNested({ each: true })
  @Type(() => DepartmentApprovalItemDto)
  @IsNotEmpty({ message: 'At least one department approval item is required' })
  items: DepartmentApprovalItemDto[];

  @IsArray({ message: 'Equipment list must be an array' })
  @ValidateNested({ each: true })
  @Type(() => EquipmentItemDto)
  @IsNotEmpty({ message: 'At least one equipment item is required' })
  equipmentList: EquipmentItemDto[];

  @IsOptional()
  @IsBoolean({ message: 'Card returned status must be a boolean' })
  cardReturned?: boolean;
}
