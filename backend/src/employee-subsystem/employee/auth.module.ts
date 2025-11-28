import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmployeeModule } from './employee.module';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    EmployeeModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' }, // default for now
    }),
  ],
  exports: [JwtModule],
})
export class AuthModule {}
