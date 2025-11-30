import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCandidateDto } from './dto/register-candidate.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Login to the system',
    description:
      'Authenticate as either a candidate or employee using email and password. Returns a JWT token and sets it as an HTTP-only cookie.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Login successful. Returns access token, user type, and user details. Also sets authentication cookie.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: LoginDto })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Set HTTP-only cookie with the JWT token
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour (matches JWT expiration)
    });

    return result;
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new candidate' })
  @ApiResponse({
    status: 201,
    description: 'Candidate successfully registered',
  })
  @ApiResponse({
    status: 409,
    description: 'Email or National ID already registered',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiBody({ type: RegisterCandidateDto })
  register(@Body() registerDto: RegisterCandidateDto) {
    return this.authService.register(registerDto);
  }
}
