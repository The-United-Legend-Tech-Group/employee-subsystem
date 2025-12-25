import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginCandidateDto {
    @ApiProperty({
        description: 'Personal email of the candidate',
        example: 'candidate@example.com',
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Password',
        example: 'password123',
    })
    @IsNotEmpty()
    @IsString()
    password: string;
}
