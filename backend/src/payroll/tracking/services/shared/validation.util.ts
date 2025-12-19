import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Validates and converts a string ID to MongoDB ObjectId
 * @param id - The ID string to validate
 * @param fieldName - Optional field name for error messages (default: 'ID')
 * @returns MongoDB ObjectId instance
 * @throws BadRequestException if ID format is invalid
 */
export function validateAndConvertObjectId(id: string, fieldName: string = 'ID'): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException(`Invalid ${fieldName} format: ${id}`);
  }
  return new Types.ObjectId(id);
}



