import { IsInt, IsString, IsOptional, Min, Max, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  id_space: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  komentar?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  foto_urls?: string[];
}
