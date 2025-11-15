import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Department } from 'src/organization-structure/schemas/department.schema';
import { Position } from 'src/organization-structure/schemas/position.schema';

export type EmployeeDocument = HydratedDocument<Employee>;

/**
 * Employment details.
 */
class EmploymentDetails {
  @Prop({ required: true, unique: true })
  employeeId: string;

  @Prop({ required: true })
  hireDate: Date;

  @Prop({ required: true })
  employmentType: string; //Fulltime, Partime or whatever is decided later
}

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

  @Prop({ type: EmploymentDetails, _id: false })
  employmentDetails: EmploymentDetails;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Position' })
  positionId: Position;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department' })
  departmentId: Department;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Employee' })
  managerId: Employee;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

// Add indexes for fields that are frequently queried
EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ 'employmentDetails.employeeId': 1 });
EmployeeSchema.index({ 'role': 1 });
