import { IsNotEmpty, IsMongoId, IsString } from 'class-validator';

export class AddOfferApproverDto {
    @IsNotEmpty()
    @IsMongoId()
    offerId: string;

    @IsNotEmpty()
    @IsString()
    employeeId: string; // Can be MongoDB ID or Employee Number
}
