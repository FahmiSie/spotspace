import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class UpdateCoworkingProfileDto {
  @IsString() @IsNotEmpty()
  nama_coworking: string;

  @IsString() @IsNotEmpty()
  nama_pemilik: string;

  @IsString() @IsNotEmpty()
  telp: string;

  @IsString() @IsOptional()
  deskripsi?: string;

  @IsString() @IsOptional()
  foto?: string;

  @IsString() @IsOptional()
  alamat?: string;

  @IsNumber() @IsOptional()
  latitude?: number;

  @IsNumber() @IsOptional()
  longitude?: number;
}