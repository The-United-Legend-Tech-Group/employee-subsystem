import { NotFoundException } from '@nestjs/common';
import { EmployeeSigningBonusService } from './EmployeesigningBonus.service';

describe('SigningBonusService', () => {
  let service: EmployeeSigningBonusService;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      findByIdAndUpdate: jest.fn(),
    };
    // @ts-ignore - constructor injection
    service = new EmployeeSigningBonusService(mockModel);
  });

  it('approveEmployeeSigningBonus returns updated doc when found', async () => {
    const dto = { signingBonusId: 'abc' } as any;
    const mockDoc = { _id: 'abc', status: 'approved' };
    mockModel.findByIdAndUpdate.mockImplementation(() => ({ exec: jest.fn().mockResolvedValue(mockDoc) }));

    const res = await service.approveEmployeeSigningBonus(dto);
    expect(res).toEqual(mockDoc);
    expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(dto.signingBonusId, { status: expect.any(String) }, { new: true });
  });

  it('approveEmployeeSigningBonus throws NotFoundException when not found', async () => {
    const dto = { signingBonusId: 'abc' } as any;
    mockModel.findByIdAndUpdate.mockImplementation(() => ({ exec: jest.fn().mockResolvedValue(null) }));

    await expect(service.approveEmployeeSigningBonus(dto)).rejects.toThrow(NotFoundException);
  });

  it('rejectEmployeeSigningBonus returns updated doc when found', async () => {
    const dto = { signingBonusId: 'abc' } as any;
    const mockDoc = { _id: 'abc', status: 'rejected' };
    mockModel.findByIdAndUpdate.mockImplementation(() => ({ exec: jest.fn().mockResolvedValue(mockDoc) }));

    const res = await service.rejectEmployeeSigningBonus(dto);
    expect(res).toEqual(mockDoc);
    expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(dto.signingBonusId, { status: expect.any(String) }, { new: true });
  });

  it('rejectEmployeeSigningBonus throws NotFoundException when not found', async () => {
    const dto = { signingBonusId: 'abc' } as any;
    mockModel.findByIdAndUpdate.mockImplementation(() => ({ exec: jest.fn().mockResolvedValue(null) }));

    await expect(service.rejectEmployeeSigningBonus(dto)).rejects.toThrow(NotFoundException);
  });
});
