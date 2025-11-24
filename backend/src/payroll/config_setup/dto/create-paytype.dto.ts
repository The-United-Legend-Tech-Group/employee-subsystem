import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { PayTypeEnum, PayTypeStatus } from '../schemas/paytype.schema';

export class CreatePayTypeDto {
  @IsNotEmpty()
  @IsEnum(PayTypeEnum)
  type: PayTypeEnum;

  @IsOptional()
  @IsEnum(PayTypeStatus)
  status?: PayTypeStatus;
}
