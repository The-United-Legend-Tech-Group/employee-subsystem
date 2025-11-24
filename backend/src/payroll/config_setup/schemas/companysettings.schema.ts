import { ConfigStatus } from '../enums/payroll-configuration-enums';

export enum CompanySettingsStatus {
  DRAFT = ConfigStatus.DRAFT,
  APPROVED = ConfigStatus.APPROVED,
  REJECTED = ConfigStatus.REJECTED,
}

export default CompanySettingsStatus;
