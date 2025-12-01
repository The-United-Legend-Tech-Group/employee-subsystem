import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../../common/repository/base.repository';
import { DocumentDocument, Document } from '../../models/document.schema';
import { IDocumentRepository } from '../interfaces/document.repository.interface';

@Injectable()
export class DocumentRepository extends BaseRepository<DocumentDocument> implements IDocumentRepository {
  constructor(
    @InjectModel(Document.name) private documentModel: Model<DocumentDocument>
  ) {
    super(documentModel);
  }

  async findByApplicationId(applicationId: string): Promise<DocumentDocument[]> {
    return this.documentModel.find({ applicationId: new Types.ObjectId(applicationId) }).exec();
  }

  async findByType(documentType: string): Promise<DocumentDocument[]> {
    return this.documentModel.find({ documentType }).exec();
  }

  async findByUploadedBy(uploadedBy: string): Promise<DocumentDocument[]> {
    return this.documentModel.find({ uploadedBy }).exec();
  }

  async findByOwnerId(ownerId: string): Promise<DocumentDocument[]> {
    return this.documentModel.find({ ownerId: new Types.ObjectId(ownerId) }).exec();
  }
}