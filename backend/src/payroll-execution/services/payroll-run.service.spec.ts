import { Types } from 'mongoose';

// ensure dependent services are mocked early so schema files don't get evaluated and cause
// decorator/schema errors when tests import the service implementation
jest.mock('./payroll-events.service', () => ({ PayrollEventsService: jest.fn() }));
jest.mock('./payroll-calculation.service', () => ({ PayrollCalculationService: jest.fn() }));
jest.mock('./payroll-exceptions.service', () => ({ PayrollExceptionsService: jest.fn() }));
jest.mock('./payslip.service', () => ({ PayslipService: jest.fn() }));

const { PayrollRunService } = require('./payroll-run.service');

describe('PayrollRunService', () => {
  let service: any;

  const fakePayrollRunModel: any = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  };

  const fakeEvents = {
    getEmployeesForPayroll: jest.fn(),
    getEmployeePenalties: jest.fn(),
    getEmployeeBonuses: jest.fn(),
    getTerminationBenefits: jest.fn(),
  } as any;

  const fakeCalc = {
    calculateSalary: jest.fn(),
    saveEmployeePayrollRecord: jest.fn(),
  } as any;

  const fakeExceptions = {
    detectExceptions: jest.fn(),
  } as any;

  const fakePayslip = {
    createPayslip: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PayrollRunService(
      fakePayrollRunModel,
      fakeEvents,
      fakeCalc,
      fakeExceptions,
      fakePayslip,
    );
  });

  it('generateDraft should orchestrate flow and return summary', async () => {
    const employeeId = new Types.ObjectId();
    const employee: any = {
      _id: employeeId,
      payGradeId: { grossSalary: 5000, baseSalary: 4500 },
      bankStatus: 'valid',
    };

    fakeEvents.getEmployeesForPayroll.mockResolvedValue([employee]);
    fakeEvents.getEmployeePenalties.mockResolvedValue(null);
    fakeEvents.getEmployeeBonuses.mockResolvedValue({ signingBonusId: { amount: 500 } });
    fakeEvents.getTerminationBenefits.mockResolvedValue(null);

    fakeCalc.calculateSalary.mockResolvedValue({
      grossSalary: 5500,
      bonusesTotal: 500,
      breakdown: { tax: 550, insurance: 275 },
      totalDeductions: 825,
      penaltiesTotal: 0,
      refundsTotal: 0,
      netSalary: 4675,
      netPay: 4675,
    });

    const createdRun: any = {
      _id: new Types.ObjectId(),
      runId: 'PR-TEST-1',
      payrollPeriod: new Date(),
      status: 'draft',
      entity: 'X',
      employees: 1,
      exceptions: 0,
      totalnetpay: 0,
      payrollSpecialistId: new Types.ObjectId(),
      paymentStatus: 'pending',
      save: jest.fn().mockResolvedValue(true),
    };

    fakePayrollRunModel.create.mockResolvedValue(createdRun);
    fakeCalc.saveEmployeePayrollRecord.mockResolvedValue({});
    fakePayslip.createPayslip.mockResolvedValue({});
    fakeExceptions.detectExceptions.mockResolvedValue([]);

    const dto = { payrollPeriod: new Date().toISOString(), entity: 'TestCo' };
    const out = await service.generateDraft(dto as any);

    expect(out).toHaveProperty('runId');
    expect(out.employees).toBe(1);
    expect(fakePayrollRunModel.create).toHaveBeenCalled();
    expect(fakeCalc.calculateSalary).toHaveBeenCalled();
  });

  it('getAllPayrollRuns returns results from model', async () => {
    fakePayrollRunModel.find.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve([{ runId: 'x' }]) }) });
    const runs = await service.getAllPayrollRuns();
    expect(Array.isArray(runs)).toBe(true);
    expect(runs[0].runId).toBe('x');
  });

  it('getPayrollRunById returns single doc', async () => {
    fakePayrollRunModel.findById.mockReturnValue({ lean: () => ({ exec: () => Promise.resolve({ runId: 'byid' }) }) });
    const r = await service.getPayrollRunById('someid');
    expect(r.runId).toBe('byid');
  });
});
