import { SetMetadata } from '@nestjs/common';
import { SystemRole } from '../../employee-subsystem/employee/enums/employee-profile.enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: SystemRole[]) => SetMetadata(ROLES_KEY, roles);
