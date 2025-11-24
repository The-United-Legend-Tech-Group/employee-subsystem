import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PayGradeStatus } from '../schemas/paygrade.schema';

export class UpdatePayGradeDto {
  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsNumber()
  grossSalary?: number;

  @IsOptional()
  @IsEnum(PayGradeStatus)
  status?: PayGradeStatus;
}
