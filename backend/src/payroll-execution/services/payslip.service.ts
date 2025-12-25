import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { paySlip, PayslipDocument } from '../models/payslip.schema';
import { Model } from 'mongoose';

@Injectable()
export class PayslipService {
  constructor(
    @InjectModel(paySlip.name) private paySlipModel: Model<PayslipDocument>,
  ) {}

  async createPayslip(payslipData: any) {
    // create paySlip document in DB
    const doc = await this.paySlipModel.create(payslipData);
    return doc;
  }
}
