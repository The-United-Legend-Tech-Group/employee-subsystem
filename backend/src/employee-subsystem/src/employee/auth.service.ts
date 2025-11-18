import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/registration.dto';
import { Types } from 'mongoose';
import { AuthRepository } from './repository/auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
  ) {}

  async register(user: RegisterDto): Promise<string> {
    const existingUser = await this.authRepository.findByEmail(user.email);
    if (existingUser) {
      throw new ConflictException('email already exists');
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await this.authRepository.create(user, hashedPassword);
    return 'registered successfully';
  }

  async signIn(email: string, password: string): Promise<{ access_token: string; payload: { userid: Types.ObjectId; role: string } }> {
    const user = await this.authRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userid: user._id, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(payload),
      payload,
    };
  }
}