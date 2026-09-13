import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
}