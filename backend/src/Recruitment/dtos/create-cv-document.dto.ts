import { IsArray, IsOptional, IsString, IsEnum, IsDateString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '../enums/document-type.enum';

export class CreateCVDocumentDto {
  @ApiProperty({
    description: 'Document owner MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  ownerId: string;

  @ApiProperty({
    description: 'Type of document',
    enum: DocumentType,
    example: DocumentType.CV
  })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({
    description: 'File storage path',
    example: '/uploads/documents/john-doe-cv.pdf'
  })
  @IsString()
  filePath: string;

  @ApiProperty({
    description: 'Document upload timestamp',
    example: '2024-11-27T10:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  uploadedAt?: Date;
}