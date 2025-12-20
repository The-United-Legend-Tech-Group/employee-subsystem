import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) { }

  getModel(): Model<T> {
    return this.model;
  }

  async create(dto: Partial<T>): Promise<T> {
    try {
      const created = new this.model(dto);
      return await created.save();
    } catch (error) {
      // Handle MongoDB duplicate key error (E11000)
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || 'field';
        const value = error.keyValue?.[field] || 'value';
        throw new ConflictException(
          `${this.model.modelName} with ${field} '${value}' already exists`,
        );
      }
      // Handle validation errors
      if (error.name === 'ValidationError') {
        throw new ConflictException(`Validation failed: ${error.message}`);
      }
      // Re-throw other errors as internal server errors with sanitized messages
      throw new InternalServerErrorException(
        `Failed to create ${this.model.modelName}: ${error.message}`,
      );
    }
  }

  async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<T> {
    const entity = await this.model.findById(id).exec();
    if (!entity) {
      throw new NotFoundException(
        `${this.model.modelName} with ID ${id} not found`,
      );
    }
    return entity;
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  async findMany(filter: FilterQuery<T>): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    try {
      return await this.model
        .findByIdAndUpdate(id, update, { new: true })
        .exec();
    } catch (error) {
      // Handle MongoDB duplicate key error (E11000)
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || 'field';
        const value = error.keyValue?.[field] || 'value';
        throw new ConflictException(
          `${this.model.modelName} with ${field} '${value}' already exists`,
        );
      }
      // Handle validation errors
      if (error.name === 'ValidationError') {
        throw new ConflictException(`Validation failed: ${error.message}`);
      }
      // Re-throw other errors
      throw new InternalServerErrorException(
        `Failed to update ${this.model.modelName}: ${error.message}`,
      );
    }
  }

  async deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
