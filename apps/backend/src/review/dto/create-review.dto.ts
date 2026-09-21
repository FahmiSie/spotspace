import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsInt()
  spaceId: number;

  @IsNotEmpty()
  @IsInt()
  reservasiId: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  komentar: string;
}
