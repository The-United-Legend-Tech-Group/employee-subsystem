import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobTemplate, JobTemplateDocument } from './models/job-template.schema';
import { JobRequisition, JobRequisitionDocument } from './models/job-requisition.schema';
import { Document, DocumentDocument } from './models/document.schema';
import { Application, ApplicationDocument } from './models/application.schema';
import { ApplicationStatusHistory, ApplicationStatusHistoryDocument } from './models/application-history.schema';

import { CreateJobTemplateDto } from './dtos/create-job-template.dto';
import { CreateJobRequisitionDto } from './dtos/create-job-requisition.dto';
import { UpdateJobRequisitionDto } from './dtos/update-jobrequisition.dto';
import { CreateCVDocumentDto } from './dtos/create-cv-document.dto';
import { CreateApplicationDto } from './dtos/create-application.dto';
import { UpdateApplicationDto } from './dtos/update-application.dto';

@Injectable()
export class RecruitmentService {
  constructor(
    @InjectModel(JobTemplate.name) private jobTemplateModel: Model<JobTemplateDocument>,
    @InjectModel(JobRequisition.name) private jobRequisitionModel: Model<JobRequisitionDocument>,
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(ApplicationStatusHistory.name) private applicationHistoryModel: Model<ApplicationStatusHistoryDocument>,
  ) { }
  getHello(): string {
    return 'Hello World!';
  }

  //REC-003: Create Job Template and Job Requisition
  async createjob_template(createjob_template: CreateJobTemplateDto): Promise<JobTemplateDocument> {
    const template = new this.jobTemplateModel(createjob_template)
    return await template.save()
  }
  async createjob_requision(createjob_requision: CreateJobRequisitionDto): Promise<JobRequisitionDocument> {
    const templateExists = await this.jobTemplateModel.findById(createjob_requision.templateId).lean();
    if (!templateExists) {
      throw new NotFoundException(`Job template with id ${createjob_requision.templateId} not found`);
    }
    const requisition = new this.jobRequisitionModel(createjob_requision);
    return await requisition.save()
  }

  //HELPS IN Doing REC-023
  async updatejob_requisition(requisitionId: string, updatejob_requisition: UpdateJobRequisitionDto): Promise<JobRequisitionDocument> {
    const requisition = await this.jobRequisitionModel.findOneAndUpdate(
      { requisitionId: requisitionId }, // Correct: plain object filter
      updatejob_requisition,
      { new: true }
    );

    if (!requisition) {
      throw new NotFoundException(`Job requisition with requisitionId ${requisitionId} not found`);
    }

    return requisition;
  }
  // REC:-023
  async getAllpublishedJobRequisition(): Promise<JobRequisitionDocument[]> {
    return this.jobRequisitionModel
      .find({ publishStatus: 'published' })
      //.populate('templateId')
      //.populate('hiringManagerId', 'name email')
      .exec();
  }
  // REC-007: Create CV Document
  async createCVDocument(createCVDocumentDto: CreateCVDocumentDto): Promise<DocumentDocument> {
    if (createCVDocumentDto.type != 'cv') {
      throw new NotFoundException(`Document type must be 'cv'`);
    }
    const document = new this.documentModel({
      ...createCVDocumentDto,
      uploadedAt: createCVDocumentDto.uploadedAt || new Date()
    }); return await document.save();
  }
  //REC-007: Create Application
  async createApplication(createApplicationDto: CreateApplicationDto): Promise<ApplicationDocument> {
    // Find the requisition by user-defined requisitionId
    const requisition = await this.jobRequisitionModel.findOne({ requisitionId: createApplicationDto.requisitionId }).lean();
    if (!requisition) {
      throw new NotFoundException(`Job requisition with id ${createApplicationDto.requisitionId} not found`);
    }

    // Check if application already exists for this candidate and requisition
    const existingApplication = await this.applicationModel.findOne({
      candidateId: new Types.ObjectId(createApplicationDto.candidateId),
      requisitionId: requisition._id
    }).lean();

    if (existingApplication) {
      throw new Error(`Application already exists for candidate ${createApplicationDto.candidateId} and requisition ${createApplicationDto.requisitionId}`);
    }

    const application = new this.applicationModel({
      candidateId: new Types.ObjectId(createApplicationDto.candidateId),
      requisitionId: requisition._id, // Use the MongoDB _id of the found requisition
      assignedHr: createApplicationDto.assignedHr ? new Types.ObjectId(createApplicationDto.assignedHr) : undefined
    });

    return application.save();
  }
  //
  async getApplicationById(applicationId: string): Promise<ApplicationDocument> {
    const application = await this.applicationModel.findById(applicationId).exec();
    if (!application) {
      throw new NotFoundException(`Application with id ${applicationId} not found`);
    }
    return application;
  }
  //REC-017 part 1
  async getallcandidateApplications(candidateId: string): Promise<ApplicationDocument[]> {
    return this.applicationModel
      .find({ candidateId: new Types.ObjectId(candidateId) })
      .exec();
  }

  // REC-017 part2 & REC-022: Update Application Status/Stage by candidateId and requisitionId
  async updateApplication(candidateId: string, requisitionId: string, updateApplicationDto: UpdateApplicationDto): Promise<ApplicationDocument> {
    // Find the requisition by user-defined requisitionId to get its MongoDB _id
    const requisition = await this.jobRequisitionModel.findOne({ requisitionId: requisitionId }).lean();
    if (!requisition) {
      throw new NotFoundException(`Job requisition with id ${requisitionId} not found`);
    }

    // Get the current application state before updating
    const currentApplication = await this.applicationModel.findOne({
      candidateId: new Types.ObjectId(candidateId),
      requisitionId: requisition._id
    });

    if (!currentApplication) {
      throw new NotFoundException(`Application not found for candidate ${candidateId} and requisition ${requisitionId}`);
    }

    // Update the application
    const updatedApplication = await this.applicationModel.findOneAndUpdate(
      {
        candidateId: new Types.ObjectId(candidateId),
        requisitionId: requisition._id // Use the MongoDB _id of the found requisition
      },
      {
        ...updateApplicationDto,
        assignedHr: updateApplicationDto.assignedHr ? new Types.ObjectId(updateApplicationDto.assignedHr) : undefined
      },
      { new: true }
    );

    if (!updatedApplication) {
      throw new NotFoundException(`Failed to update application for candidate ${candidateId} and requisition ${requisitionId}`);
    }

    // Create history record if there were changes
    if (updateApplicationDto.currentStage || updateApplicationDto.status) {
      const historyRecord = new this.applicationHistoryModel({
        applicationId: currentApplication._id,
        oldStage: currentApplication.currentStage,
        newStage: updateApplicationDto.currentStage || currentApplication.currentStage,
        oldStatus: currentApplication.status,
        newStatus: updateApplicationDto.status || currentApplication.status,
        changedBy: new Types.ObjectId('000000000000000000000000') // TODO: Replace with actual user ID from auth context
      });

      await historyRecord.save();
    }

    return updatedApplication;
  }
}