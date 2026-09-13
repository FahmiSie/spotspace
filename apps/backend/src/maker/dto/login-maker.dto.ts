import { IsString, MinLength } from 'class-validator';

export class LoginMakerDto {
  @IsString()
  usernameOrEmail: string;

  @IsString()
  @MinLength(6)
  password: string;
}
