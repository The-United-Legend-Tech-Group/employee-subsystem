import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Department } from '../../organization-structure/schemas/department.schema';
import { Position } from '../../organization-structure/schemas/position.schema';

export type EmployeeDocument = HydratedDocument<Employee>;

@Schema({
  timestamps: true, //createdAt and updatedAt
  collection: 'employees',
})
export class Employee {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop()
  contactPhone: string;

  @Prop()
  profilePictureUrl: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({
    required: true,
    enum: ['Employee', 'Manager', 'HR_Manager', 'HR_Admin', 'Sys_Admin', 'Payroll_Specialist', 
       'Payroll_Manager', 'Finance_Staff'],
    default: 'Employee',
  })
  role: string;

  @Prop({ required: true, unique: true })
  employeeId: string;

  @Prop({ required: true })
  hireDate: Date;

  @Prop({ required: true })
  employmentType: string; // Fulltime, Partime or similar

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Position' })
  positionId: Position;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department' })
  departmentId: Department;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Employee' })
  managerId: Employee;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false})
  signingBonus: boolean;

  @Prop({ type: Boolean, default: false})
  resignationStatus: boolean
}

//Add Contract

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

// Add indexes for fields that are frequently queried
EmployeeSchema.index({ 'role': 1 });
