import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ToggleWishlistDto {
  @Type(() => Number)
  @IsInt()
  id_space: number;
}
