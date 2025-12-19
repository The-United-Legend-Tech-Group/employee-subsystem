import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class PaginationQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';

    @IsOptional()
    @IsEnum(ConfigStatus)
    status?: ConfigStatus;
}

export class InsuranceBracketPaginationDto extends PaginationQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minSalary?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxSalary?: number;
}
