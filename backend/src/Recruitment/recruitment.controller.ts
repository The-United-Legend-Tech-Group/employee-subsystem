import { Controller, Get } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';

@Controller()
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get()
  getHello(): string {
    return this.recruitmentService.getHello();
  }
}
