import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RuleType } from '../types/rule-type';
import { CalculationMethod } from '../types/calculation-method';
import { HolidayType } from '../types/holiday-type';

export type RuleConfigDocument = RuleConfig & Document;

@Schema({ timestamps: true })
export class RuleConfig {
  @Prop({ type: String, enum: Object.values(RuleType), required: true })
  ruleType: RuleType;

  @Prop()
  gracePeriodMinutes?: number;

  @Prop()
  maxAllowedPerMonth?: number;

  @Prop({ type: String, enum: Object.values(CalculationMethod) })
  calculationMethod?: CalculationMethod;

  @Prop({ default: false })
  isHoliday?: boolean;

  @Prop({ type: String, enum: Object.values(HolidayType) })
  holidayType?: HolidayType;

  @Prop({ default: false })
  isRestDay?: boolean;

  @Prop()
  restDayName?: string;

  @Prop({ default: true })
  suppressLateness?: boolean;

  @Prop({ default: true })
  suppressEarlyLeave?: boolean;

  @Prop({ default: true })
  suppressPenalties?: boolean;

  @Prop({ default: true })
  appliesToOvernightShifts?: boolean;

  @Prop({ type: Types.ObjectId, ref: 'LeaveType' })
  linkedLeaveType?: Types.ObjectId;

  @Prop({ default: true })
  active?: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  configuredBy?: Types.ObjectId;
}

export const RuleConfigSchema = SchemaFactory.createForClass(RuleConfig);
