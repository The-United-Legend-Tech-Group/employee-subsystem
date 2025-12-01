import { ApiProperty } from '@nestjs/swagger';

export class OvertimeRecordDto {
  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  employeeName: string;

  @ApiProperty()
  department: string;

  @ApiProperty()
  date: Date;

  @ApiProperty({ description: 'Total overtime hours' })
  overtimeHours: number;

  @ApiProperty({ description: 'Shift start time' })
  shiftStartTime: string;

  @ApiProperty({ description: 'Shift end time' })
  shiftEndTime: string;

  @ApiProperty({ description: 'Actual clock in time' })
  actualClockIn: Date;

  @ApiProperty({ description: 'Actual clock out time' })
  actualClockOut: Date;

  @ApiProperty({ description: 'Whether overtime was pre-approved' })
  wasApproved: boolean;

  @ApiProperty({ description: 'Whether it was on a holiday' })
  isHoliday: boolean;

  @ApiProperty({ description: 'Holiday type if applicable', required: false })
  holidayType?: string;
}

export class ExceptionRecordDto {
  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  employeeName: string;

  @ApiProperty()
  department: string;

  @ApiProperty()
  date: Date;

  @ApiProperty({ description: 'Type of exception' })
  exceptionType: string;

  @ApiProperty({ description: 'Details of the exception' })
  details: string;

  @ApiProperty({ description: 'Whether employee had missed punch' })
  hasMissedPunch: boolean;

  @ApiProperty({ description: 'Total work minutes for the day' })
  totalWorkMinutes: number;

  @ApiProperty({ description: 'Expected work minutes based on shift' })
  expectedWorkMinutes: number;

  @ApiProperty({ description: 'Shift name', required: false })
  shiftName?: string;

  @ApiProperty({ description: 'Whether it was on a weekly rest day' })
  isWeeklyRest: boolean;

  @ApiProperty({ description: 'Whether correction request was submitted' })
  hasCorrectionRequest: boolean;
}

export class OvertimeReportDto {
  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;

  @ApiProperty({ description: 'Period start date' })
  periodStart: Date;

  @ApiProperty({ description: 'Period end date' })
  periodEnd: Date;

  @ApiProperty({ description: 'Total overtime records' })
  totalRecords: number;

  @ApiProperty({ description: 'Total overtime hours across all employees' })
  totalOvertimeHours: number;

  @ApiProperty({ type: [OvertimeRecordDto] })
  records: OvertimeRecordDto[];
}

export class ExceptionReportDto {
  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;

  @ApiProperty({ description: 'Period start date' })
  periodStart: Date;

  @ApiProperty({ description: 'Period end date' })
  periodEnd: Date;

  @ApiProperty({ description: 'Total exception records' })
  totalRecords: number;

  @ApiProperty({ type: [ExceptionRecordDto] })
  records: ExceptionRecordDto[];
}
