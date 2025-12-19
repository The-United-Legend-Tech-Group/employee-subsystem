
import { IsNotEmpty, IsString, IsEnum, IsNumber ,Min, IsOptional} from 'class-validator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';


export class CreateAllowanceDto {
  
    @IsNotEmpty()
    @IsString()
    name: string  

    @IsNumber()
    @Min(0)
    amount: number

    @IsEnum(ConfigStatus)
    @IsOptional()
    status?: ConfigStatus

    @IsString()
    @IsOptional()
    createdBy? : string;

}