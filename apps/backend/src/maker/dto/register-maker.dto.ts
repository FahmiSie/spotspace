import { IsString, IsEmail, MinLength } from 'class-validator';

export class RegisterMakerDto {
  @IsString()
  name: string;

  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
