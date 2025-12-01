import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PayrollRunPeriodService } from './payrollRunPeriod.service';

describe('PayrollRunPeriodService', () => {
  let service: PayrollRunPeriodService;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    // @ts-ignore
    service = new PayrollRunPeriodService(mockModel);
  });

  it('editPayrollPeriod updates when run is rejected', async () => {
    const dto = { payrollRunId: 'rid', newPayrollPeriod: '2025-11-30T00:00:00.000Z' } as any;
    const existing = { _id: 'rid', status: 'rejected' };
    const updated = { _id: 'rid', payrollPeriod: new Date(dto.newPayrollPeriod) };

    mockModel.findById.mockImplementation(() => ({ orFail: () => ({ exec: jest.fn().mockResolvedValue(existing) }) }));
    mockModel.findByIdAndUpdate.mockImplementation(() => ({ orFail: () => ({ exec: jest.fn().mockResolvedValue(updated) }) }));

    const res = await service.editPayrollPeriod(dto);
    expect(res).toEqual(updated);
  });

  it('editPayrollPeriod throws BadRequest when status not rejected', async () => {
    const dto = { payrollRunId: 'rid', newPayrollPeriod: '2025-11-30T00:00:00.000Z' } as any;
    const existing = { _id: 'rid', status: 'approved' };
    mockModel.findById.mockImplementation(() => ({ orFail: () => ({ exec: jest.fn().mockResolvedValue(existing) }) }));

    await expect(service.editPayrollPeriod(dto)).rejects.toThrow(BadRequestException);
  });

  it('editPayrollPeriod throws NotFound when not found', async () => {
    const dto = { payrollRunId: 'rid', newPayrollPeriod: '2025-11-30T00:00:00.000Z' } as any;
    mockModel.findById.mockImplementation(() => ({ orFail: () => { throw new NotFoundException(); } }));

    await expect(service.editPayrollPeriod(dto)).rejects.toThrow(NotFoundException);
  });
});
