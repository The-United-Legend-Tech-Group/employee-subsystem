import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxDocumentDto } from './create-tax-document.dto';

export class UpdateTaxDocumentDto extends PartialType(CreateTaxDocumentDto) {}

