import { IsString, IsNotEmpty } from 'class-validator';

export class CheckPromoDto {
  @IsString() @IsNotEmpty()
  nama_diskon: string;
}