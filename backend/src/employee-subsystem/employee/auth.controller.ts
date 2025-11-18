import { Body, Controller, HttpStatus, Post, HttpException, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/authentication.guard';
import { authorizationGuard } from './guards/authorization.guard';
import { Roles, Role } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
 
}