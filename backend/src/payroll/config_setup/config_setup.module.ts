import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigSetupService } from './config_setup.service';
import { ConfigSetupController } from './config_setup.controller';
import { DatabaseModule } from '../../../database/database.module';

// Schema imports
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
import { payType, payTypeSchema } from './models/payType.schema';
import {
  payrollPolicies,
  payrollPoliciesSchema,
} from './models/payrollPolicies.schema';
import {
  terminationAndResignationBenefits,
  terminationAndResignationBenefitsSchema,
} from './models/terminationAndResignationBenefits';
import { signingBonus, signingBonusSchema } from './models/signingBonus.schema';
import { taxRules, taxRulesSchema } from './models/taxRules.schema';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: allowance.name, schema: allowanceSchema },
      { name: CompanyWideSettings.name, schema: CompanyWideSettingsSchema },
      { name: insuranceBrackets.name, schema: insuranceBracketsSchema },
      { name: payGrade.name, schema: payGradeSchema },
      { name: payType.name, schema: payTypeSchema },
      { name: payrollPolicies.name, schema: payrollPoliciesSchema },
      {
        name: terminationAndResignationBenefits.name,
        schema: terminationAndResignationBenefitsSchema,
      },
      { name: signingBonus.name, schema: signingBonusSchema },
      { name: taxRules.name, schema: taxRulesSchema },
    ]),
  ],
  controllers: [ConfigSetupController],
  providers: [ConfigSetupService],
  exports: [MongooseModule], // Export MongooseModule so other modules can use these schemas
})
export class ConfigSetupModule {}
