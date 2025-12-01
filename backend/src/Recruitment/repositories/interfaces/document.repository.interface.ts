import { IRepository } from '../../../common/repository/base.repository';
import { DocumentDocument } from '../../models/document.schema';
import { DocumentType } from '../../enums/document-type.enum';

export interface IDocumentRepository extends IRepository<DocumentDocument> {
  findByOwnerId(ownerId: string): Promise<DocumentDocument[]>;
  findByType(type: DocumentType): Promise<DocumentDocument[]>;
}