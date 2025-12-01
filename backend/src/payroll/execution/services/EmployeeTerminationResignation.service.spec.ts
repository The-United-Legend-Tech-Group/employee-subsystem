import { NotFoundException } from '@nestjs/common';
import { EmployeeTerminationResignationService } from './EmployeeTerminationResignation.service';

describe('EmployeeTerminationResignationService', () => {
  let service: EmployeeTerminationResignationService;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      findByIdAndUpdate: jest.fn(),
    };
    // @ts-ignore
    service = new EmployeeTerminationResignationService(mockModel);
  });

  it('approveTermination returns updated doc when found', async () => {
    const dto = { terminationRecordId: 'id' } as any;
    const doc = { _id: 'id', status: 'approved' };
    mockModel.findByIdAndUpdate.mockImplementation(() => ({ exec: jest.fn().mockResolvedValue(doc) }));

    const res = await service.approveTermination(dto);
    expect(res).toEqual(doc);
  });

  it('approveTermination throws when not found', async () => {
    const dto = { terminationRecordId: 'id' } as any;
    mockModel.findByIdAndUpdate.mockImplementation(() => ({ exec: jest.fn().mockResolvedValue(null) }));

    await expect(service.approveTermination(dto)).rejects.toThrow(NotFoundException);
  });

  it('rejectTermination returns updated doc when found', async () => {
    const dto = { terminationRecordId: 'id', reason: 'no' } as any;
    const doc = { _id: 'id', status: 'rejected' };
    mockModel.findByIdAndUpdate.mockImplementation(() => ({ exec: jest.fn().mockResolvedValue(doc) }));

    const res = await service.rejectTermination(dto);
    expect(res).toEqual(doc);
  });

  it('rejectTermination throws when not found', async () => {
    const dto = { terminationRecordId: 'id' } as any;
    mockModel.findByIdAndUpdate.mockImplementation(() => ({ exec: jest.fn().mockResolvedValue(null) }));

    await expect(service.rejectTermination(dto)).rejects.toThrow(NotFoundException);
  });
});
