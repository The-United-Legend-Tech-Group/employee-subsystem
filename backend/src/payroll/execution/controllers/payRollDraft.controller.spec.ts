import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PayRollDraftController } from './payRollDraft.controller';

describe('PayRollDraftController (e2e)', () => {
  let app: INestApplication;
  const mockSigning = {
    approveEmployeeSigningBonus: jest.fn().mockResolvedValue({ ok: true }),
    rejectEmployeeSigningBonus: jest.fn().mockResolvedValue({ ok: true }),
  };
  const mockTermination = {
    approveTermination: jest.fn().mockResolvedValue({ ok: true }),
    rejectTermination: jest.fn().mockResolvedValue({ ok: true }),
  };
  const mockPayroll = {
    editPayrollPeriod: jest.fn().mockResolvedValue({ ok: true }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PayRollDraftController],
    })
      .overrideProvider('SigningBonusService')
      .useValue(mockSigning)
      .overrideProvider('EmployeeTerminationResignationService')
      .useValue(mockTermination)
      .overrideProvider('PayrollRunPeriodService')
      .useValue(mockPayroll)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/signing-bonus/approve (POST)', () =>
    request(app.getHttpServer())
      .post('/execution/draft/signing-bonus/approve')
      .send({ signingBonusId: 'abc' })
      .expect(201)
      .expect({ ok: true }));

  it('/signing-bonus/reject (POST)', () =>
    request(app.getHttpServer())
      .post('/execution/draft/signing-bonus/reject')
      .send({ signingBonusId: 'abc' })
      .expect(201)
      .expect({ ok: true }));

  it('/termination/approve (POST)', () =>
    request(app.getHttpServer())
      .post('/execution/draft/termination/approve')
      .send({ terminationRecordId: 't1' })
      .expect(201)
      .expect({ ok: true }));

  it('/termination/reject (POST)', () =>
    request(app.getHttpServer())
      .post('/execution/draft/termination/reject')
      .send({ terminationRecordId: 't1' })
      .expect(201)
      .expect({ ok: true }));

  it('/payroll-run/period (PATCH)', () =>
    request(app.getHttpServer())
      .patch('/execution/draft/payroll-run/period')
      .send({ payrollRunId: 'r1', newPayrollPeriod: '2025-11-30T00:00:00.000Z' })
      .expect(200)
      .expect({ ok: true }));
});
