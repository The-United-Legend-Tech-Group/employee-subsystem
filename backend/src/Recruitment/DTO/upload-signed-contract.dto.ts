import { IsNotEmpty, IsOptional, IsString, IsInt, IsArray } from 'class-validator';

export class UploadSignedContractDto {
  @IsNotEmpty()
  @IsString()
  contractId: string;

  @IsOptional()
  @IsString()
  candidateId?: string;

  // Index into the uploaded files array that corresponds to the main signed contract file.
  @IsOptional()
  @IsInt()
  mainContractFileIndex?: number;

  @IsOptional()
  @IsString()
  signedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Array of document types corresponding to each uploaded file (e.g., ['contract', 'id', 'certificate'])
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentTypes?: string[];
}
