import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ReplyReviewDto {
  @IsNotEmpty({ message: 'Balasan tidak boleh kosong' })
  @IsString()
  @MinLength(3, { message: 'Balasan minimal 3 karakter' })
  balasan: string;
}
