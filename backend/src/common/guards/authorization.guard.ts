import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { SystemRole } from '../../employee-profile/enums/employee-profile.enums';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeSystemRole } from '../../employee-profile/models/employee-system-role.schema';

@Injectable()
export class authorizationGuard implements CanActivate {
  private readonly logger = new Logger(authorizationGuard.name);

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
    if (!user) {
      this.logger.error('Authorization failed: No user attached to request');
      throw new UnauthorizedException('no user attached');
    }

    // Extract JWT roles once at the beginning
    const jwtRoles: string[] | undefined = Array.isArray(user.roles)
      ? user.roles
      : user.role
        ? [user.role]
        : undefined;

    const isCandidate = jwtRoles?.includes(SystemRole.JOB_CANDIDATE);

    // If user is a candidate, skip EmployeeSystemRole lookup and use JWT roles directly
    if (isCandidate) {
      if (!jwtRoles || jwtRoles.length === 0) {
        this.logger.warn(`Authorization denied for candidate ${user.sub}: no roles found in JWT`);
        throw new ForbiddenException('unauthorized access');
      }

      const hasRoleFromJwt = requiredRoles.some((role) =>
        jwtRoles.includes(role),
      );

      if (!hasRoleFromJwt) {
        this.logger.warn(`Authorization denied (JWT) for candidate ${user.sub}: required one of [${requiredRoles}], but user has [${jwtRoles}]`);
        throw new ForbiddenException('unauthorized access');
      }

      this.logger.verbose(`Authorization granted (JWT) for candidate ${user.sub}: matched roles ${jwtRoles}`);
      return true;
    }

    // Prefer employee id from cookies (note: cookie name is 'employeeid' in auth.controller)
    const rawEmployeeId =
      request.cookies?.employeeid ||
      request.cookies?.employeeId ||
      user.employeeId ||
      user.sub;

    const employeeId =
      typeof rawEmployeeId === 'string'
        ? rawEmployeeId.trim()
        : rawEmployeeId?.toString?.();

    // If we have an employee id, look up roles from the EmployeeSystemRole collection
    if (employeeId) {
      this.logger.debug(`Checking roles for employeeId: ${employeeId}`);

      // Build $or query to handle both String and ObjectId storage formats
      const or: any[] = [{ employeeProfileId: employeeId }];
      if (Types.ObjectId.isValid(employeeId)) {
        or.push({ employeeProfileId: new Types.ObjectId(employeeId) });
      }

      // Query for active records, sorted by updatedAt to get the most recent
      // This handles cases where multiple records exist with different storage formats
      const employeeRoles = await this.employeeSystemRoleModel
        .findOne({ $or: or, isActive: true })
        .sort({ updatedAt: -1 })
        .exec();

      // If DB lookup fails or roles are empty, fall back to JWT roles rather than hard-denying.
      if (employeeRoles?.roles?.length) {
        const hasRoleFromDb = requiredRoles.some((role) =>
          employeeRoles.roles.includes(role),
        );
        if (hasRoleFromDb) {
          this.logger.verbose(`Authorization granted (DB) for employee ${employeeId}: matched ${employeeRoles.roles}`);
          return true;
        }
        // DB record exists but doesn't contain the role → deny
        this.logger.warn(`Authorization denied (DB) for employee ${employeeId}: required one of [${requiredRoles}], but user has [${employeeRoles.roles}]`);
        throw new ForbiddenException('unauthorized access');
      }
    }

    // Fallback: rely on JWT payload roles (already extracted above)
    if (!jwtRoles || jwtRoles.length === 0) {
      this.logger.warn(`Authorization denied for user ${user.sub}: no roles found in JWT`);
      throw new ForbiddenException('unauthorized access');
    }

    const hasRoleFromJwt = requiredRoles.some((role) =>
      jwtRoles.includes(role),
    );

    if (!hasRoleFromJwt) {
      this.logger.warn(`Authorization denied (JWT) for user ${user.sub}: required one of [${requiredRoles}], but user has [${jwtRoles}]`);
      throw new ForbiddenException('unauthorized access');
    }

    this.logger.verbose(`Authorization granted (JWT) for user ${user.sub}: matched roles ${jwtRoles}`);
    return true;
  }
}
