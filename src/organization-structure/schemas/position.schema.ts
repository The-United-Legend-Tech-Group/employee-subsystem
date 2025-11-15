import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Department } from 'src/organization-structure/schemas/department.schema';

@Schema({
  timestamps: true,
  collection: 'positions',
})
export class Position {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, trim: true })
  positionCode: string;

  @Prop({ trim: true })
  description: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  })
  departmentId: Department;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Position', default: null })
  reportsToPositionId: Position; // For building the org chart hierarchy

  @Prop({ required: true, trim: true })
  jobGrade: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean; // For deactivation

  @Prop({ type: Date })
  validFrom: Date; // For historical delimiting

  @Prop({ type: Date, default: null })
  validTo: Date; // For historical delimiting
}

export const PositionSchema = SchemaFactory.createForClass(Position);