import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignReviewerDto {
  @ApiProperty({ description: 'Employee id of the reviewer' })
  @IsNotEmpty()
  @IsString()
  assignedReviewerEmployeeId: string;
}
