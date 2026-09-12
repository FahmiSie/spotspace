import { IsOptional, IsInt, IsIn, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminReservasiQueryDto {
  @IsOptional() @Type(() => Number) @IsInt()
  month?: number;

  @IsOptional() @Type(() => Number) @IsInt()
  year?: number;

  @IsOptional() @IsIn(['belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan'])
  status?: string;

  @IsOptional() @Type(() => Number) @IsInt()
  id_space?: number;

  @IsOptional() @IsDateString()
  tanggal?: string;
}