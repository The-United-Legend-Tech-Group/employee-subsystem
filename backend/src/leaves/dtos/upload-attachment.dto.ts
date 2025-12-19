import { IsString, IsOptional, IsNumber } from 'class-validator';
export class UploadAttachmentDto {

    @IsString()
    originalName: string; 

    @IsString()
    filePath: string;  

    @IsString()
    @IsOptional()
    fileType?: string;   

    @IsNumber()
    @IsOptional()
    size?: number;        
  }
  