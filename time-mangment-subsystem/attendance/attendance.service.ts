import { Injectable } from '@nestjs/common';

@Injectable()
export class AttendanceService {
  getStatus() {
    return { status: 'ok' };
  }
}
