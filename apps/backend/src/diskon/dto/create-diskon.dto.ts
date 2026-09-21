import { IsString, IsNotEmpty, IsNumber, Min, Max, IsDateString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDiskonDto {
  @IsString() @IsNotEmpty()
  nama_diskon: string;

  @IsNumber() @Min(1) @Max(100)
  persentase_diskon: number;

  @IsDateString()
  tanggal_awal: string;

  @IsDateString()
  tanggal_akhir: string;

  @IsOptional() @Type(() => Number) @IsInt()
  space_id?: number;
}