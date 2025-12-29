import { IsNotEmpty, IsMongoId, IsEnum, IsOptional, IsString } from 'class-validator';

export class ApproveOfferDto {
    @IsNotEmpty()
    @IsMongoId()
    offerId: string;



    @IsNotEmpty()
    @IsEnum(['approved', 'rejected'])
    status: 'approved' | 'rejected';

    @IsOptional()
    @IsString()
    comment?: string;
}
