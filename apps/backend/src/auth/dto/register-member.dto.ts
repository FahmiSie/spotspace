import { IsString, IsNotEmpty, MinLength, IsOptional, IsEmail } from 'class-validator';

export class RegisterMemberDto {
  @IsString() @IsNotEmpty()
  username: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email: string;

  @IsString() @MinLength(6)
  password: string;

  @IsString() @IsNotEmpty()
  nama_member: string;

  @IsString() @IsOptional()
  instansi?: string;

  @IsString() @IsNotEmpty()
  alamat: string;

  @IsString() @IsNotEmpty()
  telp: string;

  @IsString() @IsOptional()
  foto?: string;
}