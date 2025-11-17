import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsString()
  recipientId: string;

  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @IsOptional()
  @IsString()
  relatedModule?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Alert', 'Info', 'Success', 'Warning'])
  type?: string;

  @IsOptional()
  @IsString()
  @IsIn(['UNICAST', 'MULTICAST'])
  deliveryType?: string;
}
