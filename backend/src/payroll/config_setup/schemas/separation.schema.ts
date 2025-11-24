import { ConfigStatus } from '../enums/payroll-configuration-enums';

export enum SeparationBenefitStatus {
  DRAFT = ConfigStatus.DRAFT,
  APPROVED = ConfigStatus.APPROVED,
  REJECTED = ConfigStatus.REJECTED,
}

export default SeparationBenefitStatus;
