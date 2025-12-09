import { CreateEmployeePenaltiesDto } from '../dto/create-employee-penalty.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  employeePenalties,
  employeePenaltiesDocument,
} from '../models/employeePenalties.schema';

@Injectable()
export class EmployeePenaltyService {
  constructor(
    @InjectModel(employeePenalties.name)
    private employeePenaltyModel: Model<employeePenaltiesDocument>,
  ) {}
  /** Create penalties for an employee */
  async createEmployeePenalties(dto: CreateEmployeePenaltiesDto) {
    const penaltiesToCreate = new this.employeePenaltyModel({
      employeeId: dto.employeeId,
      penalties: dto.penalties.map((p) => ({
        reason: p.reason,
        amount: p.amount,
      })),
    });
    return await penaltiesToCreate.save();
  }
}
