import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { SystemRole } from '../../employee/enums/employee-profile.enums';

export class CreateNotificationDto {
    @IsArray()
    @IsMongoId({ each: true })
    @IsNotEmpty()
    recipientId: string[];

    @IsEnum(['Alert', 'Info', 'Success', 'Warning'])
    @IsNotEmpty()
    type: string;

    @IsEnum(['UNICAST', 'MULTICAST', 'BROADCAST'])
    @IsNotEmpty()
    deliveryType: string;

    @IsEnum(SystemRole)
    @IsOptional()
    deliverToRole?: SystemRole;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    message: string;

    @IsMongoId()
    @IsOptional()
    relatedEntityId?: string;

    @IsString()
    @IsOptional()
    relatedModule?: string;

    @IsBoolean()
    @IsOptional()
    isRead?: boolean;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    readAt?: Date;
}
