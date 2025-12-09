import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateEmployeeDepartmentDto {
    @ApiProperty({ description: 'The ID of the new department', example: '64f1b2c3e4b0a1b2c3d4e5f6' })
    @IsNotEmpty()
    @IsString()
    departmentId: string;
}
