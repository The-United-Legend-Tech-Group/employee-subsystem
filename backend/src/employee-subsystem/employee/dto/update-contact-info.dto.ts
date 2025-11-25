import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

class AddressDto {
    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    streetAddress?: string;

    @IsOptional()
    @IsString()
    country?: string;
}

export class UpdateContactInfoDto {
    @IsOptional()
    @IsString()
    mobilePhone?: string;

    @IsOptional()
    @IsString()
    homePhone?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => AddressDto)
    address?: AddressDto;
}
