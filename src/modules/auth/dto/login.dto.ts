import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
export class LoginDto {
  @MaxLength(300)
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}