import { StructureRequestType } from '../enums/organization-structure.enums';

export class CreateStructureChangeRequestDto {
  requestedByEmployeeId: string;
  requestType: StructureRequestType;
  targetDepartmentId?: string;
  targetPositionId?: string;
  details?: string;
  reason?: string;
  // optional field in case submitter differs from requester
  submittedByEmployeeId?: string;
}
