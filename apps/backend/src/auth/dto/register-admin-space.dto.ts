import { IsString, IsNotEmpty, MinLength, IsEmail } from 'class-validator';

export class RegisterAdminSpaceDto {
  @IsString() @IsNotEmpty()
  username: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email: string;

  @IsString() @MinLength(6)
  password: string;

  @IsString() @IsNotEmpty()
  namaCoworking: string;

  @IsString() @IsNotEmpty()
  namaPemilik: string;

  @IsString() @IsNotEmpty()
  telp: string;
}
