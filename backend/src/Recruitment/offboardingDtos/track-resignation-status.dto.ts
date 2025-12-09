import { IsMongoId, IsNotEmpty } from 'class-validator';


export class TrackResignationStatusDto {

  @IsMongoId({ message: 'Employee ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Employee ID is required' })
  employeeId: string;
}
