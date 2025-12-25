import { IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetOfferDto {
	@IsString()
	offerDocument: string;

	@Type(() => Number)
	@IsNumber()
	benifitsum: number;
}


