import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Gender, MaritalStatus } from '../enums/employee-profile.enums';

@Schema({ _id: false })
export class Address {
  @Prop({ type: String })
  city?: string;

  @Prop({ type: String })
  streetAddress?: string;

  @Prop({ type: String })
  country?: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ _id: false })
export class UserProfileBase {
  // Names
  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String })
  middleName?: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: String })
  fullName?: string;

  @Prop({ type: String, required: true, unique: true })
  nationalId: string;

  // Demographics
  @Prop({ type: String, enum: Object.values(Gender) })
  gender?: Gender;

  @Prop({ type: String, enum: Object.values(MaritalStatus) })
  maritalStatus?: MaritalStatus;

  @Prop({ type: Date })
  dateOfBirth?: Date;

  // Contact
  @Prop({ type: String })
  personalEmail?: string;

  @Prop({ type: String })
  mobilePhone?: string;

  @Prop({ type: String })
  homePhone?: string;

  @Prop({ type: AddressSchema })
  address?: Address;

  @Prop({ type: String })
  profilePictureUrl?: string;

  @Prop({ type: String, select: false })
  password?: string;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeSystemRole' })
  accessProfileId?: Types.ObjectId;
}

export const UserProfileBaseSchema =
  SchemaFactory.createForClass(UserProfileBase);