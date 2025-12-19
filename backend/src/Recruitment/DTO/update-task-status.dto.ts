import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateTaskStatusDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsNotEmpty()
  @IsString()
  taskName: string;

  @IsNotEmpty()
  @IsString()
  status: string; // 'pending', 'in_progress', 'completed'

  @IsOptional()
  @IsString()
  documentId?: string; // Link uploaded document to task
}
