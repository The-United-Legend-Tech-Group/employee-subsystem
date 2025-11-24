import { ConfigStatus } from '../enums/payroll-configuration-enums';

export enum InsuranceBracketStatus {
  DRAFT = ConfigStatus.DRAFT,
  APPROVED = ConfigStatus.APPROVED,
  REJECTED = ConfigStatus.REJECTED,
}

export default InsuranceBracketStatus;
