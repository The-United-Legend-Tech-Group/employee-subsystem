import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ExternalEmployeeRequestDto } from './dto/external-employee-request.dto';
import { EmployeeExternalService } from './employee-external.service';
import { ApiKeyGuard } from 'src/employee/guards/api-key.guard';

@Controller('employee')
@UseGuards(ApiKeyGuard)
export class EmployeeExternalController {
  constructor(private readonly employeeExternalService: EmployeeExternalService) {}

  @Post('external')
  async getEmployeeForSubsystem(@Body() body: ExternalEmployeeRequestDto) {
    const { employeeId, subsystem } = body;
    return this.employeeExternalService.getForSubsystem(employeeId, subsystem);
  }
}
