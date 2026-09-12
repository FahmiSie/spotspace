import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class CreateMemberAdminDto {
  @IsString() @IsNotEmpty()
  username: string;

  @IsString() @MinLength(6)
  password: string;

  @IsString() @IsNotEmpty()
  nama_member: string;

  @IsString() @IsNotEmpty()
  instansi: string;

  @IsString() @IsNotEmpty()
  alamat: string;

  @IsString() @IsNotEmpty()
  telp: string;

  @IsString() @IsOptional()
  foto?: string;
}