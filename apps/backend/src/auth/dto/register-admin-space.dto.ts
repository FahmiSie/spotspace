import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterAdminSpaceDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  namaCoworking: string;

  @IsString()
  @IsNotEmpty()
  namaPemilik: string;

  @IsString()
  @IsNotEmpty()
  telp: string;
}
