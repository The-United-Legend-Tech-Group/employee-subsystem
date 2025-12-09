import {
  Model,
  Document,
  FilterQuery,
  UpdateQuery,
  QueryOptions,
} from 'mongoose';

export interface IRepository<T> {
  create(dto: Partial<T>): Promise<T>;
  findOne(filter: FilterQuery<T>): Promise<T | null>;
  findById(id: string): Promise<T | null>;
  find(filter?: FilterQuery<T>): Promise<T[]>;
  update(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions,
  ): Promise<T | null>;
  updateById(
    id: string,
    update: UpdateQuery<T>,
    options?: QueryOptions,
  ): Promise<T | null>;
  delete(filter: FilterQuery<T>): Promise<{ deletedCount?: number }>;
  deleteById(id: string): Promise<any>;
  updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<any>;
}

export class BaseRepository<T extends Document> implements IRepository<T> {
  protected readonly model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(dto: Partial<T>): Promise<T> {
    const created = new this.model(dto as any);
    return created.save();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async find(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  async update(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true },
  ): Promise<T | null> {
    return this.model.findOneAndUpdate(filter, update, options).exec();
  }

  async updateById(
    id: string,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true },
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, options).exec();
  }

  async delete(filter: FilterQuery<T>): Promise<{ deletedCount?: number }> {
    const res = await this.model.deleteMany(filter).exec();
    return { deletedCount: (res as any).deletedCount };
  }

  async deleteById(id: string): Promise<any> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async countDocuments(query: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(query).exec();
  }

  async updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<any> {
    return this.model.updateMany(filter, update).exec();
  }
}
