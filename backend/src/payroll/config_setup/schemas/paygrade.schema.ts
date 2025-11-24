import { ConfigStatus } from '../enums/payroll-configuration-enums';

export enum PayGradeStatus {
  DRAFT = ConfigStatus.DRAFT,
  APPROVED = ConfigStatus.APPROVED,
  REJECTED = ConfigStatus.REJECTED,
}

export default PayGradeStatus;
