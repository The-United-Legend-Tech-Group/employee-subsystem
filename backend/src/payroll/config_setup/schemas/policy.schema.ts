import {
  ConfigStatus,
  PolicyType,
  Applicability,
} from '../enums/payroll-configuration-enums';

export enum PolicyStatus {
  DRAFT = ConfigStatus.DRAFT,
  APPROVED = ConfigStatus.APPROVED,
  REJECTED = ConfigStatus.REJECTED,
}

export { PolicyType, Applicability };

export default PolicyStatus;
