import { IsInt, IsDateString, IsString, IsNumber, Min, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckAvailabilityDto {
  @Type(() => Number) @IsInt()
  id_space: number;

  @IsDateString()
  tanggal: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Format jam_mulai harus HH:mm' })
  jam_mulai: string;

  @Type(() => Number) @IsNumber() @Min(1)
  durasi_jam: number;
}