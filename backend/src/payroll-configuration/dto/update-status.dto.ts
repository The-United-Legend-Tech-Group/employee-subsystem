import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Status of the configuration',
    enum: ConfigStatus,
    example: ConfigStatus.APPROVED,
  })
  @IsEnum(ConfigStatus)
  status: ConfigStatus;
}
