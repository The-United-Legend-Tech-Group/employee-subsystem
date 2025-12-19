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
  ) { }

  async getPendingApprovals() {
    const [
      allowances,
      insuranceBrackets,
      payGrades,
      payrollPolicies,
      payTypes,
      signingBonuses,
      taxRules,
      terminationBenefits,
    ] = await Promise.all([
      this.allowance.countPending(),
      this.insuranceBracket.countPending(),
      this.payGrade.countPending(),
      this.payrollPolicy.countPending(),
      this.payType.countPending(),
      this.signingBonus.countPending(),
      this.taxRule.countPending(),
      this.terminationBenefit.countPending(),
    ]);

    return {
      allowances,
      insuranceBrackets,
      payGrades,
      payrollPolicies,
      payTypes,
      signingBonuses,
      taxRules,
      terminationBenefits,
      total:
        allowances +
        insuranceBrackets +
        payGrades +
        payrollPolicies +
        payTypes +
        signingBonuses +
        taxRules +
        terminationBenefits,
    };
  }
}

