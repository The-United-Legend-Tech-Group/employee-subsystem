import { Controller, Get } from '@nestjs/common';

@Controller('attendance')
export class AttendanceController {
  @Get()
  health() {
    return { ok: true };
  }
}
