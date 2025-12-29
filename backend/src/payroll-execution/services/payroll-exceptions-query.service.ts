import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  employeePayrollDetails,
  employeePayrollDetailsDocument,
} from '../models/employeePayrollDetails.schema';

type Severity = 'high' | 'medium' | 'low';
type Status = 'pending' | 'resolved';

@Injectable()
export class PayrollExceptionsQueryService {
  constructor(
    @InjectModel(employeePayrollDetails.name)
    private readonly detailsModel: Model<employeePayrollDetailsDocument>,
  ) {}

  private inferSeverityFromMessage(message: string): Severity {
    const m = message.toLowerCase();
    if (
      m.includes('missing bank') ||
      m.includes('negative') ||
      m.includes('exceeds gross')
    )
      return 'high';
    if (
      m.includes('pay grade') ||
      m.includes('exceeds net salary') ||
      m.includes('new hire') ||
      m.includes('offboarding')
    )
      return 'medium';
    return 'low';
  }

  private inferTypeFromMessage(message: string): string {
    const m = message.toLowerCase();
    if (m.includes('missing bank')) return 'missing-bank';
    if (m.includes('negative')) return 'negative-pay';
    if (
      m.includes('exceeds gross') ||
      m.includes('salary spike') ||
      m.includes('exceeds net')
    )
      return 'salary-spike';
    return 'calculation-error';
  }

  async getExceptions(payrollRunId: string, employeeId?: string) {
    const filter: any = { payrollRunId: new Types.ObjectId(payrollRunId) };
    if (employeeId) filter.employeeId = new Types.ObjectId(employeeId);

    const docs = await this.detailsModel.find(filter).lean().exec();

    const exceptions = docs.flatMap((d) => {
      const raw = (d.exceptions ?? '').trim();
      if (!raw) return [];

      const parts = raw
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);

      return parts.map((msg, idx) => ({
        id: `${String(d._id)}-${idx}`,
        payrollRunId: String(d.payrollRunId),
        employeeId: String(d.employeeId),
        type: this.inferTypeFromMessage(msg),
        severity: this.inferSeverityFromMessage(msg),
        description: msg,
        status: 'pending' as Status,
      }));
    });

    return { exceptions };
  }

  async clearExceptions(payrollRunId: string, employeeId: string) {
    const result = await this.detailsModel.updateOne(
      {
        payrollRunId: new Types.ObjectId(payrollRunId),
        employeeId: new Types.ObjectId(employeeId),
      },
      {
        $set: { exceptions: '' },
      },
    );

    if (result.matchedCount === 0) {
      throw new Error('Employee payroll details not found');
    }

    return {
      success: true,
      message: 'Exceptions cleared successfully',
      modified: result.modifiedCount,
    };
  }
}
