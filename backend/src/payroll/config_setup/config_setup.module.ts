import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigSetupController } from './config_setup.controller';
import { ConfigSetupService } from './config_setup.service';

// Import individual services
import {
  AllowanceService,
  CompanySettingsService,
  InsuranceBracketService,
  PayGradeService,
  PayrollPolicyService,
  PayTypeService,
  SigningBonusService,
  TaxRuleService,
  TerminationBenefitService,
} from './services';

// Import all repositories
import {
  AllowanceRepository,
  CompanyWideSettingsRepository,
  InsuranceBracketsRepository,
  PayGradeRepository,
  PayrollPoliciesRepository,
  PayTypeRepository,
  SigningBonusRepository,
  TaxRulesRepository,
  TerminationBenefitsRepository,
} from './repositories';

// Import all schemas
import { allowance, allowanceSchema } from './models/allowance.schema';
import {
  CompanyWideSettings,
  CompanyWideSettingsSchema,
} from './models/CompanyWideSettings.schema';
import {
  insuranceBrackets,
  insuranceBracketsSchema,
} from './models/insuranceBrackets.schema';
import { payGrade, payGradeSchema } from './models/payGrades.schema';
import {
  payrollPolicies,
  payrollPoliciesSchema,
} from './models/payrollPolicies.schema';
import { payType, payTypeSchema } from './models/payType.schema';
import { signingBonus, signingBonusSchema } from './models/signingBonus.schema';
import { taxRules, taxRulesSchema } from './models/taxRules.schema';
import {
  terminationAndResignationBenefits,
  terminationAndResignationBenefitsSchema,
} from './models/terminationAndResignationBenefits';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: allowance.name, schema: allowanceSchema },
      { name: CompanyWideSettings.name, schema: CompanyWideSettingsSchema },
      { name: insuranceBrackets.name, schema: insuranceBracketsSchema },
      { name: payGrade.name, schema: payGradeSchema },
      { name: payrollPolicies.name, schema: payrollPoliciesSchema },
      { name: payType.name, schema: payTypeSchema },
      { name: signingBonus.name, schema: signingBonusSchema },
      { name: taxRules.name, schema: taxRulesSchema },
      {
        name: terminationAndResignationBenefits.name,
        schema: terminationAndResignationBenefitsSchema,
      },
    ]),
  ],
  controllers: [ConfigSetupController],
  providers: [
    // Main service (encapsulates all individual services)
    ConfigSetupService,
    // Individual services (internal only)
    AllowanceService,
    CompanySettingsService,
    InsuranceBracketService,
    PayGradeService,
    PayrollPolicyService,
    PayTypeService,
    SigningBonusService,
    TaxRuleService,
    TerminationBenefitService,
    // Repositories (internal only)
    AllowanceRepository,
    CompanyWideSettingsRepository,
    InsuranceBracketsRepository,
    PayGradeRepository,
    PayrollPoliciesRepository,
    PayTypeRepository,
    SigningBonusRepository,
    TaxRulesRepository,
    TerminationBenefitsRepository,
  ],
  exports: [ConfigSetupService], // export the facade service
})
export class ConfigSetupModule {}
