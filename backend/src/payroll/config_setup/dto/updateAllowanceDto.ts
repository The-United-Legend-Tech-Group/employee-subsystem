import { PartialType } from '@nestjs/mapped-types';
import { IsMongoId, IsOptional, IsDateString } from 'class-validator';
import { CreateAllowanceDto } from './createAllowanceDto';


export class UpdateAllowanceDto extends PartialType(CreateAllowanceDto) {

    @IsOptional()
    @IsMongoId()
    approvedBy?: string;

    @IsOptional()
    @IsDateString()
    approvedAt?: string;

}
