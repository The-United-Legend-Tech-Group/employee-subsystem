import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleDocument,
} from '../models/employee-system-role.schema';

@Injectable()
export class EmployeeSystemRoleRepository extends BaseRepository<EmployeeSystemRoleDocument> {
  constructor(
    @InjectModel(EmployeeSystemRole.name)
    model: Model<EmployeeSystemRoleDocument>,
  ) {
    super(model);
  }

  async findByEmployeeProfileId(employeeProfileId: any): Promise<EmployeeSystemRoleDocument | null> {
    console.log('🔍 [EmployeeSystemRoleRepository.findByEmployeeProfileId] Input:', {
      inputValue: employeeProfileId,
      inputType: typeof employeeProfileId,
      inputConstructor: employeeProfileId?.constructor?.name,
    });

    // Handle both string and ObjectId storage formats
    // Some records have employeeProfileId as string, some as ObjectId
    const stringId = typeof employeeProfileId === 'string'
      ? employeeProfileId
      : employeeProfileId.toString();

    console.log('🔍 [EmployeeSystemRoleRepository.findByEmployeeProfileId] String ID:', stringId);

    let objectId: Types.ObjectId | null = null;
    try {
      objectId = new Types.ObjectId(stringId);
      console.log('🔍 [EmployeeSystemRoleRepository.findByEmployeeProfileId] ObjectId created:', {
        objectIdValue: objectId,
        objectIdHexString: objectId.toHexString(),
      });
    } catch (error) {
      console.log('⚠️ [EmployeeSystemRoleRepository.findByEmployeeProfileId] Failed to create ObjectId:', error);
    }

    // Query with $or to match either string or ObjectId format
    const query = objectId
      ? { $or: [{ employeeProfileId: stringId }, { employeeProfileId: objectId }] }
      : { employeeProfileId: stringId };

    console.log('🔍 [EmployeeSystemRoleRepository.findByEmployeeProfileId] Query:', JSON.stringify(query, null, 2));

    // First, let's check how many documents match this query
    const allMatchingDocuments = await this.model.find(query).exec();
    console.log('🔍 [EmployeeSystemRoleRepository.findByEmployeeProfileId] Total matching documents:', allMatchingDocuments.length);

    if (allMatchingDocuments.length > 1) {
      console.log('⚠️ [EmployeeSystemRoleRepository.findByEmployeeProfileId] MULTIPLE RECORDS FOUND!');
      allMatchingDocuments.forEach((doc, idx) => {
        console.log(`  [${idx}]`, {
          _id: doc._id?.toString(),
          employeeProfileId: doc.employeeProfileId,
          employeeProfileIdConstructor: doc.employeeProfileId?.constructor?.name,
          roles: doc.roles,
          isActive: doc.isActive,
          createdAt: doc.get('createdAt'),
          updatedAt: doc.get('updatedAt'),
        });
      });
    }

    // Try to find the active one first
    const activeQuery = objectId
      ? {
        $or: [{ employeeProfileId: stringId }, { employeeProfileId: objectId }],
        isActive: true
      }
      : { employeeProfileId: stringId, isActive: true };

    let result = await this.model.findOne(activeQuery).sort({ updatedAt: -1 }).exec();

    // If no active record found, fall back to any matching record
    if (!result && allMatchingDocuments.length > 0) {
      console.log('⚠️ [EmployeeSystemRoleRepository.findByEmployeeProfileId] No active record found, using first matching record');
      result = allMatchingDocuments[0];
    }

    console.log('🔍 [EmployeeSystemRoleRepository.findByEmployeeProfileId] Result:', {
      found: !!result,
      documentId: result?._id?.toString(),
      storedEmployeeProfileId: result?.employeeProfileId,
      storedEmployeeProfileIdType: typeof result?.employeeProfileId,
      storedEmployeeProfileIdConstructor: result?.employeeProfileId?.constructor?.name,
      roles: result?.roles,
      isActive: result?.isActive,
    });

    return result;
  }

  async debugListAll(): Promise<EmployeeSystemRoleDocument[]> {
    const totalCount = await this.model.countDocuments();
    console.log('🔍 [EmployeeSystemRoleRepository.debugListAll] Total documents in collection:', totalCount);

    const all = await this.model.find().limit(10).exec();

    console.log('🔍 [EmployeeSystemRoleRepository.debugListAll] Sample documents with type info:');
    all.forEach((doc, index) => {
      console.log(`  [${index}]`, {
        _id: doc._id?.toString(),
        employeeProfileId: doc.employeeProfileId,
        employeeProfileIdType: typeof doc.employeeProfileId,
        employeeProfileIdConstructor: doc.employeeProfileId?.constructor?.name,
        employeeProfileIdHex: doc.employeeProfileId instanceof Types.ObjectId
          ? doc.employeeProfileId.toHexString()
          : 'N/A (not ObjectId)',
        roles: doc.roles,
        isActive: doc.isActive,
      });
    });

    return all;
  }
}
