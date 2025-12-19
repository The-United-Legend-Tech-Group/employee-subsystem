import { IsNotEmpty, IsMongoId, IsEnum, IsOptional, IsString } from 'class-validator';

export class CandidateRespondOfferDto {
    @IsNotEmpty()
    @IsMongoId()
    offerId: string;



    @IsNotEmpty()
    @IsEnum(['accepted', 'rejected', 'negotiating'])
    response: 'accepted' | 'rejected' | 'negotiating';

    @IsOptional()
    @IsString()
    notes?: string;
}
