import {
  IsString,
  IsNumber,
  IsEnum,
  IsDate,
  IsOptional,
  Min,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFinalizedPayslipDto {
  @IsString()
  employee: string;

  @IsMongoId()
  employee_id: string;

  @IsEnum(['Signing Bonus', 'Termination', 'Resignation'])
  type: 'Signing Bonus' | 'Termination' | 'Resignation';

  @IsEnum(['System Processed', 'Under Review', 'Approved', 'Rejected'])
  @IsOptional()
  status?: 'System Processed' | 'Under Review' | 'Approved' | 'Rejected';

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(['USD', 'GBP'])
  @IsOptional()
  currency?: 'USD' | 'GBP';

  @IsDate()
  @Type(() => Date)
  processed_date: Date;

  @IsDate()
  @Type(() => Date)
  effective_date: Date;
}
