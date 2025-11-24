import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PayGradeStatus } from '../schemas/paygrade.schema';

export class CreatePayGradeDto {
  @IsNotEmpty()
  @IsString()
  position: string;

  @IsNotEmpty()
  @IsNumber()
  grossSalary: number;

  @IsOptional()
  @IsEnum(PayGradeStatus)
  status?: PayGradeStatus;
}
