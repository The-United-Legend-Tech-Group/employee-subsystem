import { IsNotEmpty, IsMongoId, IsEnum, IsOptional, IsString } from 'class-validator';

export class ApproveOfferDto {
    @IsNotEmpty()
    @IsMongoId()
    offerId: string;

    @IsNotEmpty()
    @IsMongoId()
    employeeId: string; // Who is approving

    @IsNotEmpty()
    @IsEnum(['approved', 'rejected'])
    status: 'approved' | 'rejected';

    @IsOptional()
    @IsString()
    comment?: string;
}
