import { Injectable } from '@nestjs/common';

@Injectable()
export class RecruitmentService {
  getHello(): string {
    return 'Hello World!';
  }
}
