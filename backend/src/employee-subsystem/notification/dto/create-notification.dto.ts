import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemRole } from '../../employee/enums/employee-profile.enums';

export class CreateNotificationDto {
  @ApiProperty({ type: [String], description: 'Array of recipient ObjectIds' })
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  recipientId: string[];

  @ApiProperty({
    enum: ['Alert', 'Info', 'Success', 'Warning'],
    description: 'Type of notification',
  })
  @IsEnum(['Alert', 'Info', 'Success', 'Warning'])
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    enum: ['UNICAST', 'MULTICAST', 'BROADCAST'],
    description: 'Delivery type',
  })
  @IsEnum(['UNICAST', 'MULTICAST', 'BROADCAST'])
  @IsNotEmpty()
  deliveryType: string;

  @ApiProperty({ description: 'Title of the notification' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Message content of the notification' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'ID of the related entity' })
  @IsMongoId()
  @IsOptional()
  relatedEntityId?: string;

  @ApiPropertyOptional({ description: 'Name of the related module' })
  @IsString()
  @IsOptional()
  relatedModule?: string;

  @ApiPropertyOptional({
    description: 'Whether the notification has been read',
  })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @ApiPropertyOptional({ enum: SystemRole, description: 'Role to deliver to' })
  @IsEnum(SystemRole)
  @IsOptional()
  deliverToRole?: SystemRole;

  @ApiPropertyOptional({ description: 'Date when the notification was read' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  readAt?: Date;
}
