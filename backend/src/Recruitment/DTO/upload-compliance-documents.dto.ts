import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class UploadComplianceDocumentsDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  // Array of document types corresponding to each uploaded file (e.g., ['id', 'contract', 'certificate'])
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  documentTypes: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
