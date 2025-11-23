import { ConfigStatus } from '../enums/payroll-configuration-enums';

export enum TaxRuleStatus {
  DRAFT = ConfigStatus.DRAFT,
  APPROVED = ConfigStatus.APPROVED,
  REJECTED = ConfigStatus.REJECTED,
}

export default TaxRuleStatus;
