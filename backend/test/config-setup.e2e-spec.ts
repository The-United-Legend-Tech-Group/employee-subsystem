import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import configuration from '../src/config/configuration';
import { ConfigSetupModule } from '../src/payroll/config_setup/config_setup.module';

describe('Config Setup API (e2e)', () => {
  let app: INestApplication;
  let createdAllowanceId: string;
  let createdPayGradeId: string;
  let createdInsuranceBracketId: string;
  let createdPayrollPolicyId: string;
  let createdCompanySettingsId: string;
  let createdPayTypeId: string;
  let createdSigningBonusId: string;
  let createdTaxRuleId: string;
  let createdTerminationBenefitId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration], // Uses configuration system
        }),
        MongooseModule.forRootAsync({
          useFactory: () => {
            const config = configuration();
            return { uri: config.database.uri }; // Dynamic database URL
          },
        }),
        ConfigSetupModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    // Reset NODE_ENV
    process.env.NODE_ENV = 'development';
  });

  describe('Allowance Endpoints', () => {
    const allowanceData = {
      name: 'Housing Allowance',
      amount: 1000,
    };

    it('/config-setup/allowances (POST) - should create an allowance', () => {
      return request(app.getHttpServer())
        .post('/config-setup/allowances')
        .send(allowanceData)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('_id');
          expect(response.body.name).toBe(allowanceData.name);
          expect(response.body.amount).toBe(allowanceData.amount);
          createdAllowanceId = response.body._id;
        });
    });

    it('/config-setup/allowances (POST) - should reject missing name', () => {
      return request(app.getHttpServer())
        .post('/config-setup/allowances')
        .send({ amount: 1000 })
        .expect(400)
        .then((response) => {
          expect(Array.isArray(response.body.message)).toBe(true);
          expect(response.body.message.join(' ')).toContain('name');
        });
    });

    it('/config-setup/allowances (POST) - should reject missing amount', () => {
      return request(app.getHttpServer())
        .post('/config-setup/allowances')
        .send({ name: 'Transport' })
        .expect(400)
        .then((response) => {
          expect(Array.isArray(response.body.message)).toBe(true);
          expect(response.body.message.join(' ')).toContain('amount');
        });
    });

    it('/config-setup/allowances (POST) - should reject negative amount', () => {
      return request(app.getHttpServer())
        .post('/config-setup/allowances')
        .send({ name: 'Transport', amount: -500 })
        .expect(400)
        .then((response) => {
          expect(response.body.message).toBeDefined();
        });
    });

    it('/config-setup/allowances (POST) - should reject non-whitelisted properties', () => {
      return request(app.getHttpServer())
        .post('/config-setup/allowances')
        .send({ name: 'Food', amount: 500, invalidField: 'test' })
        .expect(400);
    });

    it('/config-setup/allowances (GET) - should return all allowances', () => {
      return request(app.getHttpServer())
        .get('/config-setup/allowances')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });

    it('/config-setup/allowances/:id (GET) - should return single allowance', () => {
      return request(app.getHttpServer())
        .get(`/config-setup/allowances/${createdAllowanceId}`)
        .expect(200)
        .then((response) => {
          expect(response.body._id).toBe(createdAllowanceId);
          expect(response.body.name).toBe(allowanceData.name);
        });
    });

    it('/config-setup/allowances/:id (GET) - should return 404 for non-existent ID', () => {
      return request(app.getHttpServer())
        .get('/config-setup/allowances/597f1f77bcf86cd799439011')
        .expect(404);
    });

    it('/config-setup/allowances/:id (GET) - should return 500 for invalid ID format', () => {
      return request(app.getHttpServer())
        .get('/config-setup/allowances/invalid-id')
        .expect(500);
    });

    it('/config-setup/allowances/:id (PATCH) - should update allowance', () => {
      const updateData = { amount: 1500 };
      return request(app.getHttpServer())
        .patch(`/config-setup/allowances/${createdAllowanceId}`)
        .send(updateData)
        .expect(200)
        .then((response) => {
          expect(response.body.amount).toBe(1500);
        });
    });

    it('/config-setup/allowances/:id (PATCH) - should reject negative amount on update', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/allowances/${createdAllowanceId}`)
        .send({ amount: -100 })
        .expect(400);
    });

    it('/config-setup/allowances/:id (PATCH) - should return 404 for non-existent ID', () => {
      return request(app.getHttpServer())
        .patch('/config-setup/allowances/507f1f77bcf86cd799439011')
        .send({ amount: 2000 })
        .expect(404);
    });

    it('/config-setup/allowances/:id/status (PATCH) - should update allowance status', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/allowances/${createdAllowanceId}/status`)
        .send({ status: 'approved' })
        .expect(200);
    });

    it('/config-setup/allowances/:id/status (PATCH) - should reject invalid status', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/allowances/${createdAllowanceId}/status`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });

    it('/config-setup/allowances/:id (DELETE) - should delete allowance', () => {
      return request(app.getHttpServer())
        .delete(`/config-setup/allowances/${createdAllowanceId}`)
        .expect(204);
    });

    it('/config-setup/allowances/:id (DELETE) - should return 404 for already deleted allowance', () => {
      return request(app.getHttpServer())
        .delete(`/config-setup/allowances/${createdAllowanceId}`)
        .expect(404);
    });
  });

  describe('Pay Grade Endpoints', () => {
    const payGradeData = {
      grade: 'Senior Engineer',
      baseSalary: 70000,
      grossSalary: 90000,
    };

    it('/config-setup/pay-grades (POST) - should create a pay grade', () => {
      return request(app.getHttpServer())
        .post('/config-setup/pay-grades')
        .send(payGradeData)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('_id');
          expect(response.body.grade).toBe(payGradeData.grade);
          createdPayGradeId = response.body._id;
        });
    });

    it('/config-setup/pay-grades (POST) - should reject missing required fields', () => {
      return request(app.getHttpServer())
        .post('/config-setup/pay-grades')
        .send({ grade: 'Junior' })
        .expect(400);
    });

    it('/config-setup/pay-grades (POST) - should reject baseSalary below 6000', () => {
      return request(app.getHttpServer())
        .post('/config-setup/pay-grades')
        .send({ grade: 'Entry Level', baseSalary: 5000, grossSalary: 7000 })
        .expect(400);
    });

    it('/config-setup/pay-grades (POST) - should reject grossSalary below 6000', () => {
      return request(app.getHttpServer())
        .post('/config-setup/pay-grades')
        .send({ grade: 'Trainee', baseSalary: 7000, grossSalary: 5000 })
        .expect(400);
    });

    it('/config-setup/pay-grades/by-name/:grade (GET) - should find pay grade by name', () => {
      return request(app.getHttpServer())
        .get(`/config-setup/pay-grades/by-name/${payGradeData.grade}`)
        .expect(200)
        .then((response) => {
          expect(response.body.grade).toBe(payGradeData.grade);
          expect(response.body.baseSalary).toBe(payGradeData.baseSalary);
        });
    });

    it('/config-setup/pay-grades/by-name/:grade (GET) - should return empty object for non-existent grade', () => {
      return request(app.getHttpServer())
        .get('/config-setup/pay-grades/by-name/NonExistentGrade')
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual({});
        });
    });

    it('/config-setup/pay-grades (GET) - should return all pay grades', () => {
      return request(app.getHttpServer())
        .get('/config-setup/pay-grades')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('/config-setup/pay-grades/:id (GET) - should return single pay grade', () => {
      return request(app.getHttpServer())
        .get(`/config-setup/pay-grades/${createdPayGradeId}`)
        .expect(200)
        .then((response) => {
          expect(response.body._id).toBe(createdPayGradeId);
          expect(response.body.grade).toBe(payGradeData.grade);
        });
    });

    it('/config-setup/pay-grades/:id (PATCH) - should update pay grade', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/pay-grades/${createdPayGradeId}`)
        .send({ baseSalary: 75000 })
        .expect(200)
        .then((response) => {
          expect(response.body.baseSalary).toBe(75000);
        });
    });

    it('/config-setup/pay-grades/:id (PATCH) - should reject invalid update', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/pay-grades/${createdPayGradeId}`)
        .send({ baseSalary: 3000 })
        .expect(400);
    });

    it('/config-setup/pay-grades/:id/status (PATCH) - should update pay grade status', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/pay-grades/${createdPayGradeId}/status`)
        .send({ status: 'approved' })
        .expect(200);
    });

    it('/config-setup/pay-grades/:id (DELETE) - should delete pay grade', () => {
      return request(app.getHttpServer())
        .delete(`/config-setup/pay-grades/${createdPayGradeId}`)
        .expect(204);
    });
  });

  describe('Insurance Bracket Endpoints', () => {
    const insuranceBracketData = {
      name: 'Social Insurance Bracket 1',
      amount: 500,
      minSalary: 0,
      maxSalary: 5000,
      employeeRate: 11,
      employerRate: 18.5,
    };

    it('/config-setup/insurance-brackets (POST) - should create insurance bracket', () => {
      return request(app.getHttpServer())
        .post('/config-setup/insurance-brackets')
        .send(insuranceBracketData)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('_id');
          expect(response.body.employeeRate).toBe(11);
          createdInsuranceBracketId = response.body._id;
        });
    });

    it('/config-setup/insurance-brackets (POST) - should reject missing required fields', () => {
      return request(app.getHttpServer())
        .post('/config-setup/insurance-brackets')
        .send({ name: 'Test Bracket' })
        .expect(400);
    });

    it('/config-setup/insurance-brackets (POST) - should reject employeeRate > 100', () => {
      return request(app.getHttpServer())
        .post('/config-setup/insurance-brackets')
        .send({
          name: 'Invalid Bracket',
          amount: 500,
          minSalary: 0,
          maxSalary: 5000,
          employeeRate: 150,
          employerRate: 18.5,
        })
        .expect(400);
    });

    it('/config-setup/insurance-brackets (POST) - should reject negative employeeRate', () => {
      return request(app.getHttpServer())
        .post('/config-setup/insurance-brackets')
        .send({
          name: 'Negative Bracket',
          amount: 500,
          minSalary: 0,
          maxSalary: 5000,
          employeeRate: -5,
          employerRate: 18.5,
        })
        .expect(400);
    });

    it('/config-setup/insurance-brackets/by-salary/:salary (GET) - should find bracket by salary', () => {
      return request(app.getHttpServer())
        .get('/config-setup/insurance-brackets/by-salary/3000')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          expect(response.body[0].minSalary).toBeLessThanOrEqual(3000);
          expect(response.body[0].maxSalary).toBeGreaterThanOrEqual(3000);
        });
    });

    it('/config-setup/insurance-brackets (GET) - should return all brackets', () => {
      return request(app.getHttpServer())
        .get('/config-setup/insurance-brackets')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('/config-setup/insurance-brackets/:id (GET) - should return single bracket', () => {
      return request(app.getHttpServer())
        .get(`/config-setup/insurance-brackets/${createdInsuranceBracketId}`)
        .expect(200)
        .then((response) => {
          expect(response.body._id).toBe(createdInsuranceBracketId);
          expect(response.body.name).toBe(insuranceBracketData.name);
        });
    });

    it('/config-setup/insurance-brackets/:id (PATCH) - should update bracket', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/insurance-brackets/${createdInsuranceBracketId}`)
        .send({ employeeRate: 12 })
        .expect(200)
        .then((response) => {
          expect(response.body.employeeRate).toBe(12);
        });
    });

    it('/config-setup/insurance-brackets/:id (PATCH) - should reject invalid rate', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/insurance-brackets/${createdInsuranceBracketId}`)
        .send({ employeeRate: 200 })
        .expect(400);
    });

    it('/config-setup/insurance-brackets/:id/status (PATCH) - should update bracket status', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/insurance-brackets/${createdInsuranceBracketId}/status`)
        .send({ status: 'approved' })
        .expect(200);
    });

    it('/config-setup/insurance-brackets/:id (DELETE) - should delete bracket', () => {
      return request(app.getHttpServer())
        .delete(`/config-setup/insurance-brackets/${createdInsuranceBracketId}`)
        .expect(204);
    });
  });

  describe('Payroll Policy Endpoints', () => {
    const payrollPolicyData = {
      policyName: 'Overtime Policy',
      policyType: 'Benefit',
      applicability: 'All Employees',
      description: 'Standard overtime compensation policy',
      effectiveDate: '2024-01-01',
      ruleDefinition: {
        percentage: 50,
        fixedAmount: 0,
        thresholdAmount: 160,
      },
    };

    it('/config-setup/payroll-policies (POST) - should create policy', () => {
      return request(app.getHttpServer())
        .post('/config-setup/payroll-policies')
        .send(payrollPolicyData)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('_id');
          expect(response.body.policyName).toBe(payrollPolicyData.policyName);
          createdPayrollPolicyId = response.body._id;
        });
    });

    it('/config-setup/payroll-policies (POST) - should accept policy without ruleDefinition initially', () => {
      return request(app.getHttpServer())
        .post('/config-setup/payroll-policies')
        .send({
          policyName: `Test Policy-${Date.now()}`,
          policyType: 'Benefit',
          applicability: 'All Employees',
          description: 'Test policy without rule definition',
          effectiveDate: '2024-01-01',
          ruleDefinition: {
            percentage: 0,
            fixedAmount: 0,
            thresholdAmount: 1,
          },
        })
        .expect(201);
    });

    it('/config-setup/payroll-policies (POST) - should reject percentage > 100', () => {
      return request(app.getHttpServer())
        .post('/config-setup/payroll-policies')
        .send({
          ...payrollPolicyData,
          policyName: 'Invalid Percentage Policy',
          ruleDefinition: {
            percentage: 150,
            fixedAmount: 0,
            thresholdAmount: 160,
          },
        })
        .expect(400);
    });

    it('/config-setup/payroll-policies (POST) - should reject negative threshold', () => {
      return request(app.getHttpServer())
        .post('/config-setup/payroll-policies')
        .send({
          ...payrollPolicyData,
          policyName: 'Invalid Threshold Policy',
          ruleDefinition: {
            percentage: 50,
            fixedAmount: 0,
            thresholdAmount: -10,
          },
        })
        .expect(400);
    });

    it('/config-setup/payroll-policies/by-type/:type (GET) - should find policies by type', () => {
      return request(app.getHttpServer())
        .get('/config-setup/payroll-policies/by-type/Benefit')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          expect(response.body[0].policyType).toBe('Benefit');
        });
    });

    it('/config-setup/payroll-policies/by-applicability/:applicability (GET) - should find by applicability', () => {
      return request(app.getHttpServer())
        .get('/config-setup/payroll-policies/by-applicability/All%20Employees')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('/config-setup/payroll-policies (GET) - should return all policies', () => {
      return request(app.getHttpServer())
        .get('/config-setup/payroll-policies')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('/config-setup/payroll-policies/:id (GET) - should return single policy', () => {
      return request(app.getHttpServer())
        .get(`/config-setup/payroll-policies/${createdPayrollPolicyId}`)
        .expect(200)
        .then((response) => {
          expect(response.body._id).toBe(createdPayrollPolicyId);
          expect(response.body.policyName).toBe(payrollPolicyData.policyName);
        });
    });

    it('/config-setup/payroll-policies/:id (PATCH) - should update policy', () => {
      const updateData = {
        description: 'Updated overtime policy',
      };
      return request(app.getHttpServer())
        .patch(`/config-setup/payroll-policies/${createdPayrollPolicyId}`)
        .send(updateData)
        .expect(200)
        .then((response) => {
          expect(response.body.description).toBe(updateData.description);
        });
    });

    it('/config-setup/payroll-policies/:id (PATCH) - should reject invalid update', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/payroll-policies/${createdPayrollPolicyId}`)
        .send({
          ruleDefinition: {
            percentage: 200,
            fixedAmount: 0,
            thresholdAmount: 160,
          },
        })
        .expect(400);
    });

    it('/config-setup/payroll-policies/:id/status (PATCH) - should update policy status', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/payroll-policies/${createdPayrollPolicyId}/status`)
        .send({ status: 'approved' })
        .expect(200);
    });

    it('/config-setup/payroll-policies/:id (DELETE) - should delete policy', () => {
      return request(app.getHttpServer())
        .delete(`/config-setup/payroll-policies/${createdPayrollPolicyId}`)
        .expect(204);
    });
  });

  describe('Company Settings Endpoints', () => {
    const companySettingsData = {
      payDate: new Date('2024-01-15'),
      timeZone: 'Africa/Cairo',
      currency: 'USD',
    };

    it('/config-setup/company-settings (POST) - should create settings', () => {
      return request(app.getHttpServer())
        .post('/config-setup/company-settings')
        .send(companySettingsData)
        .expect(201)
        .then((response) => {
          expect(response.body.timeZone).toBe(companySettingsData.timeZone);
          createdCompanySettingsId = response.body._id;
        });
    });

    it('/config-setup/company-settings (POST) - should reject missing payDate', () => {
      return request(app.getHttpServer())
        .post('/config-setup/company-settings')
        .send({ timeZone: 'Africa/Cairo' })
        .expect(400);
    });

    it('/config-setup/company-settings (POST) - should reject missing timeZone', () => {
      return request(app.getHttpServer())
        .post('/config-setup/company-settings')
        .send({ payDate: new Date('2024-01-15') })
        .expect(400);
    });

    it('/config-setup/company-settings (GET) - should return all settings', () => {
      return request(app.getHttpServer())
        .get('/config-setup/company-settings')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('/config-setup/company-settings/:id (GET) - should return single setting', () => {
      return request(app.getHttpServer())
        .get(`/config-setup/company-settings/${createdCompanySettingsId}`)
        .expect(200)
        .then((response) => {
          expect(response.body._id).toBe(createdCompanySettingsId);
          expect(response.body.timeZone).toBe(companySettingsData.timeZone);
        });
    });

    it('/config-setup/company-settings/:id (PATCH) - should update settings', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/company-settings/${createdCompanySettingsId}`)
        .send({ currency: 'EUR' })
        .expect(200)
        .then((response) => {
          expect(response.body.currency).toBe('EUR');
        });
    });

    it('/config-setup/company-settings/:id (DELETE) - should delete settings', () => {
      return request(app.getHttpServer())
        .delete(`/config-setup/company-settings/${createdCompanySettingsId}`)
        .expect(204);
    });
  });

  describe('Pay Type Endpoints', () => {
    const uniqueType = `Hourly-${Date.now()}`;

    it('/config-setup/pay-types (POST) - should create pay type', () => {
      return request(app.getHttpServer())
        .post('/config-setup/pay-types')
        .send({
          type: uniqueType,
          amount: 7000,
        })
        .expect(201)
        .then((response) => {
          expect(response.body.type).toBe(uniqueType);
          expect(response.body.amount).toBe(7000);
          createdPayTypeId = response.body._id;
        });
    });

    it('/config-setup/pay-types (POST) - should reject duplicate type', () => {
      return request(app.getHttpServer())
        .post('/config-setup/pay-types')
        .send({
          type: uniqueType,
          amount: 8000,
        })
        .expect(409);
    });

    it('/config-setup/pay-types (POST) - should reject amount below 6000', () => {
      return request(app.getHttpServer())
        .post('/config-setup/pay-types')
        .send({
          type: `Weekly-${Date.now()}`,
          amount: 5000,
        })
        .expect(400);
    });

    it('/config-setup/pay-types (POST) - should reject missing type', () => {
      return request(app.getHttpServer())
        .post('/config-setup/pay-types')
        .send({ amount: 7000 })
        .expect(400);
    });

    it('/config-setup/pay-types (GET) - should return all pay types', () => {
      return request(app.getHttpServer())
        .get('/config-setup/pay-types')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });

    it('/config-setup/pay-types/:id (GET) - should return single pay type', () => {
      return request(app.getHttpServer())
        .get(`/config-setup/pay-types/${createdPayTypeId}`)
        .expect(200)
        .then((response) => {
          expect(response.body._id).toBe(createdPayTypeId);
          expect(response.body.type).toBe(uniqueType);
        });
    });

    it('/config-setup/pay-types/:id (PATCH) - should update pay type', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/pay-types/${createdPayTypeId}`)
        .send({ amount: 8500 })
        .expect(200)
        .then((response) => {
          expect(response.body.amount).toBe(8500);
        });
    });

    it('/config-setup/pay-types/:id (PATCH) - should reject invalid amount', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/pay-types/${createdPayTypeId}`)
        .send({ amount: 4000 })
        .expect(400);
    });

    it('/config-setup/pay-types/:id/status (PATCH) - should update pay type status', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/pay-types/${createdPayTypeId}/status`)
        .send({ status: 'approved' })
        .expect(200);
    });

    it('/config-setup/pay-types/:id (DELETE) - should delete pay type', () => {
      return request(app.getHttpServer())
        .delete(`/config-setup/pay-types/${createdPayTypeId}`)
        .expect(204);
    });
  });

  describe('Signing Bonus Endpoints', () => {
    const uniquePosition = `Senior Developer-${Date.now()}`;

    it('/config-setup/signing-bonuses (POST) - should create signing bonus', () => {
      return request(app.getHttpServer())
        .post('/config-setup/signing-bonuses')
        .send({
          positionName: uniquePosition,
          amount: 10000,
        })
        .expect(201)
        .then((response) => {
          expect(response.body.amount).toBe(10000);
          expect(response.body.positionName).toBe(uniquePosition);
          createdSigningBonusId = response.body._id;
        });
    });

    it('/config-setup/signing-bonuses (POST) - should reject duplicate position', () => {
      return request(app.getHttpServer())
        .post('/config-setup/signing-bonuses')
        .send({
          positionName: uniquePosition,
          amount: 15000,
        })
        .expect(409);
    });

    it('/config-setup/signing-bonuses (POST) - should reject negative amount', () => {
      return request(app.getHttpServer())
        .post('/config-setup/signing-bonuses')
        .send({
          positionName: `Manager-${Date.now()}`,
          amount: -5000,
        })
        .expect(400);
    });

    it('/config-setup/signing-bonuses (POST) - should reject missing fields', () => {
      return request(app.getHttpServer())
        .post('/config-setup/signing-bonuses')
        .send({ positionName: 'Engineer' })
        .expect(400);
    });

    it('/config-setup/signing-bonuses (GET) - should return all bonuses', () => {
      return request(app.getHttpServer())
        .get('/config-setup/signing-bonuses')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('/config-setup/signing-bonuses/:id (GET) - should return single bonus', () => {
      return request(app.getHttpServer())
        .get(`/config-setup/signing-bonuses/${createdSigningBonusId}`)
        .expect(200)
        .then((response) => {
          expect(response.body._id).toBe(createdSigningBonusId);
          expect(response.body.positionName).toBe(uniquePosition);
        });
    });

    it('/config-setup/signing-bonuses/:id (PATCH) - should update bonus', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/signing-bonuses/${createdSigningBonusId}`)
        .send({ amount: 12000 })
        .expect(200)
        .then((response) => {
          expect(response.body.amount).toBe(12000);
        });
    });

    it('/config-setup/signing-bonuses/:id/status (PATCH) - should update bonus status', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/signing-bonuses/${createdSigningBonusId}/status`)
        .send({ status: 'approved' })
        .expect(200);
    });

    it('/config-setup/signing-bonuses/:id (DELETE) - should delete bonus', () => {
      return request(app.getHttpServer())
        .delete(`/config-setup/signing-bonuses/${createdSigningBonusId}`)
        .expect(204);
    });
  });

  describe('Tax Rule Endpoints', () => {
    const uniqueTaxName = `Income Tax 0-50000-${Date.now()}`;

    it('/config-setup/tax-rules (POST) - should create tax rule', () => {
      return request(app.getHttpServer())
        .post('/config-setup/tax-rules')
        .send({
          name: uniqueTaxName,
          rate: 15,
          description: 'Basic tax bracket',
        })
        .expect(201)
        .then((response) => {
          expect(response.body.rate).toBe(15);
          expect(response.body.name).toBe(uniqueTaxName);
          createdTaxRuleId = response.body._id;
        });
    });

    it('/config-setup/tax-rules (POST) - should reject duplicate name', () => {
      return request(app.getHttpServer())
        .post('/config-setup/tax-rules')
        .send({
          name: uniqueTaxName,
          rate: 20,
        })
        .expect(409);
    });

    it('/config-setup/tax-rules (POST) - should reject negative rate', () => {
      return request(app.getHttpServer())
        .post('/config-setup/tax-rules')
        .send({
          name: `Tax Bracket-${Date.now()}`,
          rate: -10,
        })
        .expect(400);
    });

    it('/config-setup/tax-rules (POST) - should reject missing name', () => {
      return request(app.getHttpServer())
        .post('/config-setup/tax-rules')
        .send({ rate: 15 })
        .expect(400);
    });

    it('/config-setup/tax-rules (POST) - should reject missing rate', () => {
      return request(app.getHttpServer())
        .post('/config-setup/tax-rules')
        .send({ name: 'Test Tax' })
        .expect(400);
    });

    it('/config-setup/tax-rules (GET) - should return all tax rules', () => {
      return request(app.getHttpServer())
        .get('/config-setup/tax-rules')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });

    it('/config-setup/tax-rules/:id (GET) - should return single tax rule', () => {
      return request(app.getHttpServer())
        .get(`/config-setup/tax-rules/${createdTaxRuleId}`)
        .expect(200)
        .then((response) => {
          expect(response.body._id).toBe(createdTaxRuleId);
          expect(response.body.name).toBe(uniqueTaxName);
        });
    });

    it('/config-setup/tax-rules/:id (PATCH) - should update tax rule', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/tax-rules/${createdTaxRuleId}`)
        .send({ rate: 18 })
        .expect(200)
        .then((response) => {
          expect(response.body.rate).toBe(18);
        });
    });

    it('/config-setup/tax-rules/:id (PATCH) - should reject negative rate', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/tax-rules/${createdTaxRuleId}`)
        .send({ rate: -5 })
        .expect(400);
    });

    it('/config-setup/tax-rules/:id/status (PATCH) - should update tax rule status', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/tax-rules/${createdTaxRuleId}/status`)
        .send({ status: 'approved' })
        .expect(200);
    });

    it('/config-setup/tax-rules/:id (DELETE) - should delete tax rule', () => {
      return request(app.getHttpServer())
        .delete(`/config-setup/tax-rules/${createdTaxRuleId}`)
        .expect(204);
    });
  });

  describe('Termination Benefits Endpoints', () => {
    const uniqueBenefitName = `End of Service Gratuity-${Date.now()}`;

    it('/config-setup/termination-benefits (POST) - should create termination benefit', () => {
      return request(app.getHttpServer())
        .post('/config-setup/termination-benefits')
        .send({
          name: uniqueBenefitName,
          amount: 15000,
          terms: 'Resignation after 5 years',
        })
        .expect(201)
        .then((response) => {
          expect(response.body.amount).toBe(15000);
          expect(response.body.name).toBe(uniqueBenefitName);
          createdTerminationBenefitId = response.body._id;
        });
    });

    it('/config-setup/termination-benefits (POST) - should reject duplicate name', () => {
      return request(app.getHttpServer())
        .post('/config-setup/termination-benefits')
        .send({
          name: uniqueBenefitName,
          amount: 20000,
        })
        .expect(409);
    });

    it('/config-setup/termination-benefits (POST) - should reject negative amount', () => {
      return request(app.getHttpServer())
        .post('/config-setup/termination-benefits')
        .send({
          name: `Severance Package-${Date.now()}`,
          amount: -1000,
        })
        .expect(400);
    });

    it('/config-setup/termination-benefits (POST) - should reject missing name', () => {
      return request(app.getHttpServer())
        .post('/config-setup/termination-benefits')
        .send({ amount: 10000 })
        .expect(400);
    });

    it('/config-setup/termination-benefits (POST) - should reject missing amount', () => {
      return request(app.getHttpServer())
        .post('/config-setup/termination-benefits')
        .send({ name: 'Test Benefit' })
        .expect(400);
    });

    it('/config-setup/termination-benefits (GET) - should return all benefits', () => {
      return request(app.getHttpServer())
        .get('/config-setup/termination-benefits')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('/config-setup/termination-benefits/:id (GET) - should return single benefit', () => {
      return request(app.getHttpServer())
        .get(`/config-setup/termination-benefits/${createdTerminationBenefitId}`)
        .expect(200)
        .then((response) => {
          expect(response.body._id).toBe(createdTerminationBenefitId);
          expect(response.body.name).toBe(uniqueBenefitName);
        });
    });

    it('/config-setup/termination-benefits/:id (PATCH) - should update benefit', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/termination-benefits/${createdTerminationBenefitId}`)
        .send({ amount: 18000, terms: 'Updated terms' })
        .expect(200)
        .then((response) => {
          expect(response.body.amount).toBe(18000);
          expect(response.body.terms).toBe('Updated terms');
        });
    });

    it('/config-setup/termination-benefits/:id (PATCH) - should reject invalid amount', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/termination-benefits/${createdTerminationBenefitId}`)
        .send({ amount: -5000 })
        .expect(400);
    });

    it('/config-setup/termination-benefits/:id/status (PATCH) - should update benefit status', () => {
      return request(app.getHttpServer())
        .patch(`/config-setup/termination-benefits/${createdTerminationBenefitId}/status`)
        .send({ status: 'approved' })
        .expect(200);
    });

    it('/config-setup/termination-benefits/:id (DELETE) - should delete benefit', () => {
      return request(app.getHttpServer())
        .delete(`/config-setup/termination-benefits/${createdTerminationBenefitId}`)
        .expect(204);
    });

    it('/config-setup/termination-benefits/:id (DELETE) - should return 404 for already deleted', () => {
      return request(app.getHttpServer())
        .delete(`/config-setup/termination-benefits/${createdTerminationBenefitId}`)
        .expect(404);
    });
  });
});

