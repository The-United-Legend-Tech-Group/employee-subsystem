import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';
import { JobTemplate, JobTemplateSchema } from './models/job-template.schema';
import {
  JobRequisition,
  JobRequisitionSchema,
} from './models/job-requisition.schema';
import { Document, DocumentSchema } from './models/document.schema';
import { Application, ApplicationSchema } from './models/application.schema';
import {
  ApplicationStatusHistory,
  ApplicationStatusHistorySchema,
} from './models/application-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobTemplate.name, schema: JobTemplateSchema },
      { name: JobRequisition.name, schema: JobRequisitionSchema },
      { name: Document.name, schema: DocumentSchema },
      { name: Application.name, schema: ApplicationSchema },
      {
        name: ApplicationStatusHistory.name,
        schema: ApplicationStatusHistorySchema,
      },
    ]),
  ],
  controllers: [RecruitmentController],
  providers: [RecruitmentService],
})
export class RecruitmentModule {}
