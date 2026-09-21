import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckPromoDto {
  @IsString() @IsNotEmpty()
  nama_diskon: string;

  @IsOptional() @Type(() => Number) @IsInt()
  space_id?: number;
}