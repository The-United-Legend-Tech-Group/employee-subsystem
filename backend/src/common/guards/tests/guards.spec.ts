import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../authentication.guard';
import { authorizationGuard } from '../authorization.guard';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { EmployeeSystemRole } from '../../../employee-subsystem/employee/models/employee-system-role.schema';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SystemRole } from '../../../employee-subsystem/employee/enums/employee-profile.enums';

describe('Guards', () => {
    let authGuard: AuthGuard;
    let authzGuard: authorizationGuard;
    let jwtService: JwtService;
    let reflector: Reflector;
    let employeeSystemRoleModel: any;

    beforeEach(async () => {
        employeeSystemRoleModel = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthGuard,
                authorizationGuard,
                {
                    provide: JwtService,
                    useValue: {
                        verifyAsync: jest.fn(),
                    },
                },
                {
                    provide: Reflector,
                    useValue: {
                        getAllAndOverride: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(EmployeeSystemRole.name),
                    useValue: employeeSystemRoleModel,
                },
            ],
        }).compile();

        authGuard = module.get<AuthGuard>(AuthGuard);
        authzGuard = module.get<authorizationGuard>(authorizationGuard);
        jwtService = module.get<JwtService>(JwtService);
        reflector = module.get<Reflector>(Reflector);
    });

    describe('AuthGuard', () => {
        it('should extract token from cookie (access_token)', async () => {
            const context = {
                getHandler: () => { },
                getClass: () => { },
                switchToHttp: () => ({
                    getRequest: () => ({
                        cookies: { access_token: 'valid_token' },
                        headers: {},
                    }),
                }),
            } as unknown as ExecutionContext;

            jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
            jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ userId: '123' });

            expect(await authGuard.canActivate(context)).toBe(true);
            expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid_token', expect.any(Object));
        });

        it('should extract token from header', async () => {
            const context = {
                getHandler: () => { },
                getClass: () => { },
                switchToHttp: () => ({
                    getRequest: () => ({
                        cookies: {},
                        headers: { authorization: 'Bearer header_token' },
                    }),
                }),
            } as unknown as ExecutionContext;

            jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
            jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ userId: '123' });

            expect(await authGuard.canActivate(context)).toBe(true);
            expect(jwtService.verifyAsync).toHaveBeenCalledWith('header_token', expect.any(Object));
        });
    });

    describe('AuthorizationGuard', () => {
        it('should authorize if employeeid cookie is present and roles match', async () => {
            const context = {
                getHandler: () => { },
                getClass: () => { },
                switchToHttp: () => ({
                    getRequest: () => ({
                        user: { userId: '123' },
                        cookies: { employeeId: 'emp123' },
                    }),
                }),
            } as unknown as ExecutionContext;

            jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([SystemRole.HR_MANAGER]);
            employeeSystemRoleModel.findOne.mockResolvedValue({
                roles: [SystemRole.HR_MANAGER],
            });

            expect(await authzGuard.canActivate(context)).toBe(true);
            expect(employeeSystemRoleModel.findOne).toHaveBeenCalledWith({ employeeProfileId: 'emp123' });
        });

        it('should deny if employeeid cookie is present but roles do not match', async () => {
            const context = {
                getHandler: () => { },
                getClass: () => { },
                switchToHttp: () => ({
                    getRequest: () => ({
                        user: { userId: '123' },
                        cookies: { employeeId: 'emp123' },
                    }),
                }),
            } as unknown as ExecutionContext;

            jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([SystemRole.HR_MANAGER]);
            employeeSystemRoleModel.findOne.mockResolvedValue({
                roles: [SystemRole.DEPARTMENT_EMPLOYEE],
            });

            await expect(authzGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
        });

        it('should authorize if employeeid is missing but request.user.role matches (Candidate)', async () => {
            const context = {
                getHandler: () => { },
                getClass: () => { },
                switchToHttp: () => ({
                    getRequest: () => ({
                        user: { userId: '123', role: SystemRole.JOB_CANDIDATE },
                        cookies: {},
                    }),
                }),
            } as unknown as ExecutionContext;

            jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([SystemRole.JOB_CANDIDATE]);

            expect(await authzGuard.canActivate(context)).toBe(true);
            expect(employeeSystemRoleModel.findOne).not.toHaveBeenCalled();
        });
    });
});
