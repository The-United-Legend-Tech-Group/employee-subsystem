import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileChangeRequest, ProfileChangeRequestSchema} from 'src/employee/schemas/profileChange.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProfileChangeRequest.name, schema: ProfileChangeRequestSchema },
    ]),
  ],
})
export class ProfileChangeModule {}
