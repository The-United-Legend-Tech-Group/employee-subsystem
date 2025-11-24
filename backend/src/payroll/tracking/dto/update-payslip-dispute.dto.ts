import { PartialType } from '@nestjs/mapped-types';
import { CreatePayslipDisputeDto } from './create-payslip-dispute.dto';

export class UpdatePayslipDisputeDto extends PartialType(CreatePayslipDisputeDto) {}

