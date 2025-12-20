import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmployeeModule } from './employee-profile.module';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    EmployeeModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [JwtModule, AuthService],
})
export class AuthModule { }
