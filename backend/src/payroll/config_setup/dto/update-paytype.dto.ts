import { IsEnum, IsOptional } from 'class-validator';
import { PayTypeEnum, PayTypeStatus } from '../schemas/paytype.schema';

export class UpdatePayTypeDto {
  @IsOptional()
  @IsEnum(PayTypeEnum)
  type?: PayTypeEnum;

  @IsOptional()
  @IsEnum(PayTypeStatus)
  status?: PayTypeStatus;
}
