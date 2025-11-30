import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
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

    const employeeId = request.cookies?.employeeId;

    if (employeeId) {
      const employeeRoles = await this.employeeSystemRoleModel.findOne({
        employeeProfileId: employeeId,
      });

      if (!employeeRoles || !employeeRoles.roles) {
        throw new UnauthorizedException('Access Denied');
      }

      const hasRole = requiredRoles.some((role) =>
        employeeRoles.roles.includes(role),
      );

      if (!hasRole) {
        throw new UnauthorizedException('unauthorized access');
      }
      return true;
    }

    // Fallback for candidates or users without employeeId cookie
    const userRole = user.role;
    if (!requiredRoles.includes(userRole))
      throw new UnauthorizedException('unauthorized access');

    return true;
  }
}
