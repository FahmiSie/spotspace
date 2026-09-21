import { IsIn, IsString, IsOptional } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['belum_dikonfirm', 'disetujui', 'dibatalkan'])
  status: 'belum_dikonfirm' | 'disetujui' | 'dibatalkan';

  @IsOptional()
  @IsString()
  alasan?: string;
}