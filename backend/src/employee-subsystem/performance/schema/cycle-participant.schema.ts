import { Prop } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Employee } from '../../employee/schema/employee.schema';
import { PerformanceTemplate } from './performance-template.schema';
import { Performance } from './performance.schema';

export class CycleParticipant {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  })
  employeeId: Employee;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  })
  managerId: Employee;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PerformanceTemplate',
    required: true,
  })
  templateId: PerformanceTemplate;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Performance',
    default: null,
  })
  appraisalId: Performance; // Link to the created appraisal record
}
