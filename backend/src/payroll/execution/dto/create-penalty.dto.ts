import { IsNumber, IsString } from 'class-validator';

export class CreatePenaltyDto {
  @IsString()
  reason: string;

  @IsNumber()
  amount: number;
}