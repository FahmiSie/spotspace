import { IsString, IsNotEmpty } from 'class-validator';

export class AddFotoDto {
  @IsString()
  @IsNotEmpty()
  url: string;
}
