import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repository/base.repository';
import {
  Attachment,
  AttachmentDocument,
} from '../models/attachment.schema';

@Injectable()
export class AttachmentRepository extends BaseRepository<AttachmentDocument> {
  constructor(
    @InjectModel(Attachment.name) model: Model<AttachmentDocument>,
  ) {
    super(model);
  }

  async findByLeaveRequestId(leaveRequestId: string): Promise<AttachmentDocument | null> {
    return this.model.findOne({ leaveRequestId }).exec();
  }

  async findByUploadedBy(uploadedBy: string): Promise<AttachmentDocument | null> {
    return this.model.findOne({ uploadedBy }).exec();
  }

  async findByFileType(fileType: string): Promise<AttachmentDocument | null> {
    return this.model.findOne({ fileType }).exec();
  }
}
