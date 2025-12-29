import { IRepository } from '../../../common/repository/base.repository';
import { OnboardingDocument } from '../../models/onboarding.schema';

export interface IOnboardingRepository extends IRepository<OnboardingDocument> {
  findByEmployeeId(employeeId: string): Promise<OnboardingDocument | null>;
  findIncomplete(): Promise<OnboardingDocument[]>;
  findByStatus(completed: boolean): Promise<OnboardingDocument[]>;
  findByDepartment(department: string): Promise<OnboardingDocument[]>;
}