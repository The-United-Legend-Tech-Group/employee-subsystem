import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { payrollRuns, payrollRunsDocument } from '../models/payrollRuns.schema';
import { PayRollStatus } from '../enums/payroll-execution-enum';
import { EditPayrollPeriodDto } from '../dto/edit-payroll-period.dto';

@Injectable()
export class PayrollRunPeriodService {
  constructor(
    @InjectModel(payrollRuns.name)
    private payrollRunsModel: Model<payrollRunsDocument>,
  ) {}

  /**
   * Edit the payrollPeriod for a payroll run only when its status is `rejected`.
   * Returns the updated payroll run document.
   */
  async editPayrollPeriod(dto: EditPayrollPeriodDto): Promise<payrollRuns> {
    try {
      // Load the document and throw NotFound if missing
      const existing = await this.payrollRunsModel
        .findById(dto.payrollRunId)
        .orFail(() => new NotFoundException('Payroll run not found'))
        .exec();

      // Only allow editing when status is rejected
      if (existing.status !== PayRollStatus.REJECTED) {
        throw new BadRequestException('Payroll period can only be edited for rejected runs');
      }

      // Update payrollPeriod
      const updated = await this.payrollRunsModel
        .findByIdAndUpdate(
          dto.payrollRunId,
          { payrollPeriod: new Date(dto.newPayrollPeriod) },
          { new: true, runValidators: true },
        )
        .orFail(() => new NotFoundException('Payroll run not found'))
        .exec();

      return updated;
    } catch (err) {
      // Re-throw to let Nest handle the exception (NotFoundException/BadRequestException)
      throw err;
    }
  }
}
