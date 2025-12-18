import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginCandidateDto } from './dto/login-candidate.dto';
import { RegisterCandidateDto } from './dto/register-candidate.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/candidate/register')
  @ApiOperation({ summary: 'Register a new candidate' })
  @ApiResponse({
    status: 201,
    description: 'The candidate has been successfully registered.',
  })
  @ApiResponse({ status: 409, description: 'Email or National ID already exists.' })
  async register(@Body() registerDto: RegisterCandidateDto) {
    return this.authService.register(registerDto);
  }

  @Post('/candidate/login')
  @ApiOperation({ summary: 'Login as a candidate' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body() loginDto: LoginCandidateDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token, candidateId } = await this.authService.login(loginDto);

    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    response.cookie('candidateId', candidateId, {
      secure: true,
      sameSite: 'none',
    });

    return {
      message: 'Login successful',
      access_token,
      candidateId,
    };
  }

  @Post('/employee/login')
  @ApiOperation({ summary: 'Login as an employee' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async employeeLogin(
    @Body() loginDto: LoginCandidateDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log('🍪 [AuthController.employeeLogin] Starting login request');

    const { access_token, employeeId, roles } = await this.authService.employeeLogin(loginDto);

    console.log('🍪 [AuthController.employeeLogin] Setting cookies:', {
      employeeId,
      rolesReceived: roles,
      rolesType: Array.isArray(roles) ? 'array' : typeof roles,
      rolesLength: roles?.length,
    });

    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    response.cookie('employeeid', employeeId, {
      secure: true,
      sameSite: 'none',
    });

    const rolesJson = JSON.stringify(roles);
    console.log('🍪 [AuthController.employeeLogin] user_roles cookie value:', rolesJson);

    response.cookie('user_roles', rolesJson, {
      secure: true,
      sameSite: 'none',
    });

    console.log('🍪 [AuthController.employeeLogin] All cookies set successfully');

    return {
      message: 'Login successful',
      access_token,
      employeeId,
      roles,
    };
  }
}
