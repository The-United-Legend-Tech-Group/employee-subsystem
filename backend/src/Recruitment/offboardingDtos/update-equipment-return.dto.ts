import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class UpdateEquipmentReturnDto {
  @IsMongoId({
    message: 'Clearance checklist ID must be a valid MongoDB ObjectId',
  })
  @IsNotEmpty({ message: 'Clearance checklist ID is required' })
  clearanceChecklistId: string;

  @IsString({ message: 'Equipment name must be a string' })
  @IsNotEmpty({ message: 'Equipment name is required' })
  equipmentName: string;

  @IsBoolean({ message: 'Returned status must be a boolean' })
  @IsNotEmpty({ message: 'Returned status is required' })
  returned: boolean;

  @IsMongoId({ message: 'Updated by ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Updated by ID is required' })
  updatedById: string;
}
