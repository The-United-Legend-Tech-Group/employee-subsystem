import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('Unauthenticated request: No token found');
      throw new UnauthorizedException('Unauthenticated request');
    }

    try {
      // Use the secret injected into JwtService from the module config
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
      this.logger.verbose(`Authenticated user: ${payload.email || payload.sub}`);
    } catch (err) {
      this.logger.error(`Authentication failed: ${err.message}`);
      throw new UnauthorizedException('invalid token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    // Prioritize Authorization header (explicit intent), then cookie
    const token =
      request.headers['authorization']?.split(' ')[1] ||
      request.cookies?.access_token ||
      request.cookies?.token;

    return token;
  }
}
