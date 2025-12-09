import { IsNotEmpty, IsMongoId, IsString } from 'class-validator';

export class AddOfferApproverDto {
    @IsNotEmpty()
    @IsMongoId()
    offerId: string;

    @IsNotEmpty()
    @IsMongoId()
    employeeId: string;

    @IsNotEmpty()
    @IsString()
    role: string; // e.g., "Hiring Manager", "Department Head", "Finance Director"
}
