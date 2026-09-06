import { IsString, IsNotEmpty, IsNumber, IsIn, IsOptional, Min } from 'class-validator';

export class CreateSpaceDto {
  @IsString() @IsNotEmpty()
  nama_space: string;

  @IsNumber() @Min(1)
  harga_per_jam: number;

  @IsIn(['desk', 'meeting_room', 'private_office'])
  tipe: 'desk' | 'meeting_room' | 'private_office';

  @IsNumber() @Min(1)
  kapasitas: number;

  @IsString() @IsOptional()
  deskripsi?: string;

  @IsString() @IsOptional()
  foto?: string;
}