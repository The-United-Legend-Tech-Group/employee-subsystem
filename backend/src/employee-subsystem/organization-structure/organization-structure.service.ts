import { Injectable } from '@nestjs/common';
import { PositionRepository } from './repository/position.repository';
import { Position } from './models/position.schema';

@Injectable()
export class OrganizationStructureService {
    constructor(private readonly positionRepository: PositionRepository) { }

    async getOpenPositions(): Promise<Position[]> {
        return this.positionRepository.find({ isActive: false });
    }
}
