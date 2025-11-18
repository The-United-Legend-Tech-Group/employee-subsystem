import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigSetupService } from './config_setup.service';
import { ConfigSetupController } from './config_setup.controller';
import { DatabaseModule } from '../../database/database.module';

// Schema imports
import { Allowance, AllowanceSchema } from './schemas/allowance.schema';
import {
  CompanySettings,
  CompanySettingsSchema,
} from './schemas/companysettings.schema';
import {
  InsuranceBracket,
  InsuranceBracketSchema,
} from './schemas/insurancebracket.schema';
import { PayGrade, PayGradeSchema } from './schemas/paygrade.schema';
import { PayType, PayTypeSchema } from './schemas/paytype.schema';
import { Policy, PolicySchema } from './schemas/policy.schema';
import {
  SeparationBenefit,
  SeparationBenefitSchema,
} from './schemas/separation.schema';
import {
  SigningBonus,
  SigningBonusSchema,
} from './schemas/signingbonus.schema';
import { TaxRule, TaxRuleSchema } from './schemas/taxrule.schema';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Allowance.name, schema: AllowanceSchema },
      { name: CompanySettings.name, schema: CompanySettingsSchema },
      { name: InsuranceBracket.name, schema: InsuranceBracketSchema },
      { name: PayGrade.name, schema: PayGradeSchema },
      { name: PayType.name, schema: PayTypeSchema },
      { name: Policy.name, schema: PolicySchema },
      { name: SeparationBenefit.name, schema: SeparationBenefitSchema },
      { name: SigningBonus.name, schema: SigningBonusSchema },
      { name: TaxRule.name, schema: TaxRuleSchema },
    ]),
  ],
  controllers: [ConfigSetupController],
  providers: [ConfigSetupService],
  exports: [MongooseModule], // Export MongooseModule so other modules can use these schemas
})
export class ConfigSetupModule {}
