import { PartialType } from '@nestjs/mapped-types';
import { CreateFinalizedPayslipDto } from './create-finalized-payslip.dto';

export class UpdateFinalizedPayslipDto extends PartialType(
  CreateFinalizedPayslipDto,
) {}
