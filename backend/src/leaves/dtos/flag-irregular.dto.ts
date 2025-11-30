// dtos/flag-irregular.dto.ts
import { IsBoolean, IsMongoId } from 'class-validator';

export class FlagIrregularDto {
  @IsBoolean()
  flag: boolean;  // true = mark irregular, false = unmark
}
