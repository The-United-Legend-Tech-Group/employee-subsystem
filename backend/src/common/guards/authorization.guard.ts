import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { SystemRole } from '../../employee-subsystem/employee/enums/employee-profile.enums';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmployeeSystemRole } from '../../employee-subsystem/employee/models/employee-system-role.schema';

@Injectable()
export class authorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(EmployeeSystemRole.name)
    private employeeSystemRoleModel: Model<EmployeeSystemRole>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const { user } = request;
    if (!user) throw new UnauthorizedException('no user attached');

    // Prefer employee id from cookies (note: cookie name is 'employeeid' in auth.controller)
    const employeeId =
      request.cookies?.employeeid ||
      request.cookies?.employeeId ||
      user.employeeId;

    // If we have an employee id, look up roles from the EmployeeSystemRole collection
    if (employeeId) {
      const employeeRoles = await this.employeeSystemRoleModel.findOne({
        employeeProfileId: employeeId,
      });

      if (!employeeRoles || !employeeRoles.roles) {
        throw new ForbiddenException('Access Denied');
      }

      const hasRoleFromDb = requiredRoles.some((role) =>
        employeeRoles.roles.includes(role),
      );

      if (hasRoleFromDb) {
        return true;
      }
      // If DB record exists but doesn't contain the role, explicitly deny
      throw new ForbiddenException('unauthorized access');
    }

    // Fallback: rely on JWT payload roles (employees) or single role (candidates/others)
    const jwtRoles: string[] | undefined = Array.isArray(user.roles)
      ? user.roles
      : user.role
      ? [user.role]
      : undefined;

    if (!jwtRoles || jwtRoles.length === 0) {
      throw new ForbiddenException('unauthorized access');
    }

    const hasRoleFromJwt = requiredRoles.some((role) =>
      jwtRoles.includes(role),
    );

    if (!hasRoleFromJwt) {
      throw new ForbiddenException('unauthorized access');
    }

    return true;
  }
}
