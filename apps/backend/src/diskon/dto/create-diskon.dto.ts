import { IsString, IsNotEmpty, IsNumber, Min, Max, IsDateString } from 'class-validator';

export class CreateDiskonDto {
  @IsString() @IsNotEmpty()
  nama_diskon: string;

  @IsNumber() @Min(1) @Max(100)
  persentase_diskon: number;

  @IsDateString()
  tanggal_awal: string;

  @IsDateString()
  tanggal_akhir: string;
}