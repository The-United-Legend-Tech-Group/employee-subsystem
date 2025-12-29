import { IsNotEmpty, IsMongoId } from 'class-validator';

export class SendOfferDto {
    @IsNotEmpty()
    @IsMongoId()
    offerId: string;
}
