import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { employeeSigningBonus, employeeSigningBonusDocument } from '../models/EmployeeSigningBonus.schema';
import { BonusStatus } from '../enums/payroll-execution-enum';
import { ApproveSigningBonusDto } from '../dto/approve-signing-bonus.dto';
import { RejectSigningBonusDto } from '../dto/reject-signing-bonus.dto';
import { EditEmployeeSigningBonusDto } from '../dto/edit-employee-signing-bonus.dto';
import { CreateEmployeeSigningBonusDto } from '../dto/create-employee-signing-bonus.dto';
import { signingBonus } from '../../config_setup/models/signingBonus.schema';

@Injectable()
export class EmployeeSigningBonusService {
    constructor(
        @InjectModel(employeeSigningBonus.name)
        private employeeSigningBonusModel: Model<employeeSigningBonusDocument>,
        @InjectModel(signingBonus.name)
        private signingBonusConfigModel: Model<signingBonus>,
        
    ) {}

    /** Approve a signing bonus record. Sets status to `approved` and optionally sets payment date. */
    async approveEmployeeSigningBonus(dto: ApproveSigningBonusDto): Promise<employeeSigningBonus> {
  
        const updated = await this.employeeSigningBonusModel
            .findByIdAndUpdate(dto.signingBonusId, {status: BonusStatus.APPROVED}, { new: true })
            .exec();

        if (!updated) {
            throw new NotFoundException('Signing bonus record not found');
        }

        return updated;
    }

    /** Reject a signing bonus record. Sets status to `rejected`. */
    async rejectEmployeeSigningBonus(dto: RejectSigningBonusDto): Promise<employeeSigningBonus> {
        const updated = await this.employeeSigningBonusModel
            .findByIdAndUpdate(dto.signingBonusId, { status: BonusStatus.REJECTED }, { new: true })
            .exec();

        if (!updated) {
            throw new NotFoundException('Signing bonus record not found');
        }

        return updated;
    }

    /** Edit the given amount for an employee signing bonus record */
    async editEmployeeSigningAmount(dto: EditEmployeeSigningBonusDto): Promise<employeeSigningBonus> {
        try {
            const updated = await this.employeeSigningBonusModel
                .findByIdAndUpdate(
                    dto.EmployeesigningBonusId,
                    { givenAmount: dto.newAmount },
                    { new: true, runValidators: true },
                )
                .orFail(() => new NotFoundException('Signing bonus record not found'))
                .exec();

            return updated;
        } catch (err) {
            throw err;
        }
    }

    /** Create an EmployeeSigningBonus by finding the signing bonus definition by position name */
    async createEmployeeSigningBonus(dto: CreateEmployeeSigningBonusDto): Promise<employeeSigningBonus> {
        try {
            // Find the signing bonus config by position name
            const signingBonusConfig = await this.signingBonusConfigModel
                .findOne({ positionName: dto.positionName })
                .orFail(() => new NotFoundException(`Signing bonus not found for position: ${dto.positionName}`))
                .exec();

            // Create the employee signing bonus record with the found config's amount as givenAmount
            const newRecord = new this.employeeSigningBonusModel({
                employeeId: dto.employeeId,
                signingBonusId: signingBonusConfig._id,
                givenAmount: signingBonusConfig.amount,
                status: BonusStatus.PENDING,
            });

            return await newRecord.save();
        } catch (err) {
            throw err;
        }
    }

}
