
import { IsNotEmpty, IsString, IsEnum, IsNumber ,Min, IsOptional} from 'class-validator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';


export class CreateAllowanceDto {
  
    @IsNotEmpty()
    @IsString()
    name: string  

    @IsNumber()
    @Min(0)
    @IsNotEmpty()   //i added this line 3ala coPilot
    amount: number

    @IsEnum(ConfigStatus)
    @IsOptional()
    status?: ConfigStatus

    @IsString()
    @IsOptional()
    createdBy? : string;

}