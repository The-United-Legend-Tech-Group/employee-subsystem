import { IsNotEmpty, IsString, IsNumber, Min, Max, ValidateIf, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Custom validator to ensure minSalary <= maxSalary
function ValidateSalaryRange(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validateSalaryRange',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(_value: any, args: ValidationArguments) {
          if (!args || !args.object) return true;
          const obj = args.object as any;
          if (obj.maxSalary !== undefined && obj.maxSalary !== null) {
            return obj.minSalary <= obj.maxSalary;
          }
          return true; // If maxSalary is not set, validation passes
        },
        defaultMessage(_args: ValidationArguments) {
          return 'Minimum salary cannot be greater than maximum salary';
        },
      },
    });
  };
}

export class CreateInsuranceBracketsDto {
  @ApiProperty({
    description: 'Insurance bracket name',
    example: 'Social Insurance Bracket 1',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Minimum salary for bracket',
    example: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Minimum salary cannot be negative' })
  @ValidateSalaryRange()
  minSalary: number;

  @ApiProperty({
    description: 'Maximum salary for bracket (optional - leave empty for no upper limit)',
    example: 5000,
    required: false,
  })
  @ValidateIf((o) => o.maxSalary !== undefined && o.maxSalary !== null)
  @IsNumber()
  @Min(0, { message: 'Maximum salary cannot be negative' })
  maxSalary?: number;

  @ApiProperty({
    description: 'Employee contribution rate (%)',
    example: 11,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  employeeRate: number;

  @ApiProperty({
    description: 'Employer contribution rate (%)',
    example: 18.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  employerRate: number;

  // Status will be set to DRAFT by default in schema
  // createdBy will be set from authenticated user
}
