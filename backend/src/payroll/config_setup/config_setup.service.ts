import { Injectable } from '@nestjs/common';
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

@Injectable()
export class ConfigSetupService {
  constructor(
    public readonly allowance: AllowanceService,
    public readonly companySettings: CompanySettingsService,
    public readonly insuranceBracket: InsuranceBracketService,
    public readonly payGrade: PayGradeService,
    public readonly payrollPolicy: PayrollPolicyService,
    public readonly payType: PayTypeService,
    public readonly signingBonus: SigningBonusService,
    public readonly taxRule: TaxRuleService,
    public readonly terminationBenefit: TerminationBenefitService,
  ) {}
}
