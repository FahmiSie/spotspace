import { IsInt, IsDateString, IsString, IsNumber, Min, Max, IsOptional, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReservasiDto {
  @Type(() => Number) @IsInt()
  id_space: number;

  @IsDateString()
  tanggal_reservasi: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Format jam_mulai harus HH:mm' })
  jam_mulai: string;

  @Type(() => Number) @IsNumber() @Min(1) @Max(12, { message: 'Durasi sewa maksimal adalah 12 jam per sesi' })
  durasi_jam: number;

  @IsOptional() @Type(() => Number) @IsInt()
  id_diskon?: number;

  @IsOptional() @IsString()
  kode_promo?: string;
}