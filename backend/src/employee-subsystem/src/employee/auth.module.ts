import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmployeeModule } from 'src/employee/employee.module';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import { AuthGuard } from './guards/authentication.guard';
import { authorizationGuard } from './guards/authorization.guard';
import { AuthRepository } from './repository/auth.repository';
dotenv.config();

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, authorizationGuard, AuthRepository],
  imports: [
    EmployeeModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' }, // default for now
    }),
  ],
})
export class AuthModule {}
