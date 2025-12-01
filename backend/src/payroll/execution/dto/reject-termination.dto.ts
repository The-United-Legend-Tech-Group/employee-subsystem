import { IsMongoId } from 'class-validator';

export class RejectTerminationDto {
  @IsMongoId()
  terminationRecordId: string;
}
