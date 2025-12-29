import { PartialType } from '@nestjs/swagger';
import { CreateAppraisalCycleDto } from './create-appraisal-cycle.dto';

//inherit from CreateAppraisalCycleDto
export class UpdateAppraisalCycleDto extends PartialType(CreateAppraisalCycleDto) { }
