import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export enum Role {
  Employee = 'Employee',
  Manager = 'Manager',
  HR_Manager = 'HR_Manager',
  HR_Admin = 'HR_Admin',
  Sys_Admin = 'Sys_Admin',
  Payroll_Specialist = 'Payroll_Specialist',
  Payroll_Manager = 'Payroll_Manager',
  Finance_Staff = 'Finance_Staff',
}
