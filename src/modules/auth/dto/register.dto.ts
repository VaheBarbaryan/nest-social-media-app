import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsMatch } from '@common/utils/validator.util';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John', maxLength: 100 })
  @MaxLength(100)
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Doe', maxLength: 100 })
  @MaxLength(100)
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ example: 'john.doe@example.com', maxLength: 300 })
  @MaxLength(300)
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 25, minimum: 18, maximum: 100 })
  @Max(100)
  @Min(18)
  @IsInt()
  @IsNotEmpty()
  age: number;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'Min 8 characters, includes uppercase, lowercase, digit, and special character',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[A-Za-z\d@.#$!%*?&]{8,}$/,
    {
      message: 'Invalid password',
    },
  )
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsMatch('password', {
    message: 'Passwords do not match',
  })
  @IsString()
  @IsNotEmpty()
  passwordConfirmation: string;
}