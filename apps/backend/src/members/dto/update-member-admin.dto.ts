import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateMemberAdminDto {
  @IsString() @IsOptional()
  nama_member?: string;

  @IsString() @IsOptional()
  instansi?: string;

  @IsString() @IsOptional()
  alamat?: string;

  @IsString() @IsOptional()
  telp?: string;

  @IsString() @IsOptional() @MinLength(6)
  password?: string;

  @IsString() @IsOptional()
  foto?: string;
}