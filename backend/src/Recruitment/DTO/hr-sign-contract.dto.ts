import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class HrSignContractDto {
  @IsNotEmpty()
  @IsString()
  contractId: string;

  @IsOptional()
  @IsString()
  hrEmployeeId?: string;

  @IsOptional()
  @IsString()
  signedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
