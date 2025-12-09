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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    response.cookie('candidateId', candidateId, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Login successful' };
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
    const { access_token, employeeId } = await this.authService.employeeLogin(loginDto);

    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    response.cookie('employeeid', employeeId, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return {
      message: 'Login successful',
      access_token,
      employeeId
    };
  }
}
