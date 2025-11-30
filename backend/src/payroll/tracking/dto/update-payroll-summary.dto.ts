import { PartialType } from '@nestjs/mapped-types';
import { CreatePayrollSummaryDto } from './create-payroll-summary.dto';

export class UpdatePayrollSummaryDto extends PartialType(
  CreatePayrollSummaryDto,
) {}
