import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppraisalDisputeStatus } from '../enums/performance.enums';

export class ResolveAppraisalDisputeDto {
  @ApiProperty({ enum: [AppraisalDisputeStatus.ADJUSTED, AppraisalDisputeStatus.REJECTED] })
  @IsNotEmpty()
  @IsEnum(AppraisalDisputeStatus)
  status: AppraisalDisputeStatus;

  @ApiProperty({ description: 'Summary of the resolution' })
  @IsNotEmpty()
  @IsString()
  resolutionSummary: string;

  @ApiProperty({ description: 'Employee id who resolved the dispute' })
  @IsNotEmpty()
  @IsString()
  resolvedByEmployeeId: string;
}
