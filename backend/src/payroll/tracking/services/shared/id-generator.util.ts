import { Model } from 'mongoose';

/**
 * Generates a unique entity ID with the given prefix
 * @param prefix - The prefix for the ID (e.g., "DISP-", "CLAIM-")
 * @param model - The Mongoose model to query for existing IDs
 * @param idField - The field name that stores the ID (default: 'id' with prefix, e.g., 'disputeId', 'claimId')
 * @returns A formatted ID string (e.g., "DISP-0001", "CLAIM-0001")
 */
export async function generateEntityId(
  prefix: string,
  model: Model<any>,
  idField: string = `${prefix.toLowerCase().replace('-', '')}Id`,
): Promise<string> {
  // Find the highest existing ID with the given prefix
  const regex = new RegExp(`^${prefix}\\d+$`);
  const lastEntity = await model
    .findOne({ [idField]: { $regex: regex } })
    .sort({ [idField]: -1 })
    .exec();

  let nextNumber = 1;
  if (lastEntity) {
    // Extract number from last ID (e.g., "DISP-0001" -> 1)
    const match = (lastEntity[idField] as string).match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format as PREFIX-0001, PREFIX-0002, etc. (4 digits)
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

