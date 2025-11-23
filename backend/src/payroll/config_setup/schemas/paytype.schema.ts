import { ConfigStatus } from '../enums/payroll-configuration-enums';

export enum PayTypeStatus {
  DRAFT = ConfigStatus.DRAFT,
  APPROVED = ConfigStatus.APPROVED,
  REJECTED = ConfigStatus.REJECTED,
}

export enum PayTypeEnum {
  SALARY = 'salary',
  BONUS = 'bonus',
}

export default PayTypeStatus;
