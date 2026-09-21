import { IsNotEmpty, IsString } from 'class-validator';

export class ChargeQrisDto {
  @IsNotEmpty()
  @IsString()
  kodeBooking: string;
}