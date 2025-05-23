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

export class RegisterDto {
  @MaxLength(100)
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @MaxLength(100)
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @MaxLength(300)
  @IsEmail({})
  @IsString()
  @IsNotEmpty()
  email: string;

  @Max(100)
  @Min(18)
  @IsInt()
  @IsNotEmpty()
  age: number

  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[A-Za-z\d@.#$!%*?&]{8,}$/,
    {
      message: 'Invalid password',
    },
  )
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsMatch('password', {
    message: 'Passwords do not match',
  })
  @IsString()
  @IsNotEmpty()
  passwordConfirmation: string;
}