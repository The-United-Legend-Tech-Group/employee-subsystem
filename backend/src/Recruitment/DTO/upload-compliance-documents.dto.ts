import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadComplianceDocumentsDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  // Array of document types corresponding to each uploaded file (e.g., ['id', 'contract', 'certificate'])
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  documentTypes: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
