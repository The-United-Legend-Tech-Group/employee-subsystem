import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'] || request.headers['X-API-KEY'];

    const configured = this.configService.get<string>('EMPLOYEE_API_KEY') || process.env.EMPLOYEE_API_KEY;

    if (!configured) {
      // If no API key configured, deny to be safe.
      return false;
    }

    if (!apiKeyHeader) {
      return false;
    }

    const provided = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;

    return provided === configured;
  }
}
