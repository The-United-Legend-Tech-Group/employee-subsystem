import { IsArray, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetApprovalFlowDto {
  @ApiProperty({
    description: 'Array of system roles that need to approve this leave request',
    type: [String],
    example: ['department head', 'HR Manager'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  roles: string[];
}

