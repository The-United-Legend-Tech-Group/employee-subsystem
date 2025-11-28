import { PartialType } from '@nestjs/swagger';
import { CreateAppraisalTemplateDto } from './create-appraisal-template.dto';

export class UpdateAppraisalTemplateDto extends PartialType(CreateAppraisalTemplateDto) { }
