import { PartialType } from '@nestjs/mapped-types';
import { CreateDiskonDto } from './create-diskon.dto';

export class UpdateDiskonDto extends PartialType(CreateDiskonDto) {}