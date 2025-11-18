import { Prop } from '@nestjs/mongoose';

export class EmployeeAcknowledgement {
  @Prop({ type: Date, default: Date.now })
  acknowledgedAt: Date;

  @Prop()
  employeeComment: string;
}
