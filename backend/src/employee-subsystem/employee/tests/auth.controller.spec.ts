import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoginCandidateDto } from '../dto/login-candidate.dto';
import { RegisterCandidateDto } from '../dto/register-candidate.dto';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn(),
    employeeLogin: jest.fn(),
    register: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should set cookies and return success message on successful login', async () => {
      const loginDto: LoginCandidateDto = {
        email: 'test@example.com',
        password: 'password',
      };
      const authResult = { access_token: 'jwt_token', candidateId: 'someId' };
      mockAuthService.login.mockResolvedValue(authResult);

      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.login(loginDto, mockResponse);

      expect(result).toEqual({
        message: 'Login successful',
        access_token: 'jwt_token',
        candidateId: 'someId',
      });
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        'jwt_token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'candidateId',
        'someId',
        expect.any(Object),
      );
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const loginDto: LoginCandidateDto = {
        email: 'test@example.com',
        password: 'wrong_password',
      };
      mockAuthService.login.mockRejectedValue(new UnauthorizedException());

      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('employeeLogin', () => {
    it('should set cookies and return success message on successful employee login', async () => {
      const loginDto: LoginCandidateDto = {
        email: 'employee@example.com',
        password: 'password',
      };
      const authResult = { access_token: 'jwt_token', employeeId: 'empId' };
      mockAuthService.employeeLogin.mockResolvedValue(authResult);

      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.employeeLogin(loginDto, mockResponse);

      expect(result).toEqual({
        message: 'Login successful',
        access_token: 'jwt_token',
        employeeId: 'empId',
      });
      expect(mockAuthService.employeeLogin).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        'jwt_token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'employeeid',
        'empId',
        expect.any(Object),
      );
    });

    it('should throw UnauthorizedException on invalid credentials for employee', async () => {
      const loginDto: LoginCandidateDto = {
        email: 'employee@example.com',
        password: 'wrong_password',
      };
      mockAuthService.employeeLogin.mockRejectedValue(new UnauthorizedException());

      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      await expect(controller.employeeLogin(loginDto, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('should register a new candidate', async () => {
      const registerDto: RegisterCandidateDto = {
        firstName: 'John',
        lastName: 'Doe',
        nationalId: '1234567890123',
        personalEmail: 'john@example.com',
        password: 'Password123',
      };

      // Mock result should not have password
      const { password, ...expectedResult } = {
        ...registerDto,
        _id: 'someId',
        candidateNumber: 'CAN-20231201-0001'
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      expect(await controller.register(registerDto)).toBe(expectedResult);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should throw ConflictException if email or national ID exists', async () => {
      const registerDto: RegisterCandidateDto = {
        firstName: 'John',
        lastName: 'Doe',
        nationalId: '1234567890123',
        personalEmail: 'john@example.com',
        password: 'Password123',
      };
      mockAuthService.register.mockRejectedValue(new ConflictException());

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
