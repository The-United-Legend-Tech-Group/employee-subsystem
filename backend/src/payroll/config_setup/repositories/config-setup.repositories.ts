import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../core';
import { allowance, allowanceDocument } from '../models/allowance.schema';
import {
  CompanyWideSettings,
  CompanyWideSettingsDocument,
} from '../models/CompanyWideSettings.schema';
import {
  insuranceBrackets,
  insuranceBracketsDocument,
} from '../models/insuranceBrackets.schema';
import { payGrade, payGradeDocument } from '../models/payGrades.schema';
import {
  payrollPolicies,
  payrollPoliciesDocument,
} from '../models/payrollPolicies.schema';
import { payType, payTypeDocument } from '../models/payType.schema';
import {
  signingBonus,
  signingBonusDocument,
} from '../models/signingBonus.schema';
import { taxRules, taxRulesDocument } from '../models/taxRules.schema';
import {
  terminationAndResignationBenefits,
  terminationAndResignationBenefitsDocument,
} from '../models/terminationAndResignationBenefits';

@Injectable()
export class AllowanceRepository extends BaseRepository<allowanceDocument> {
  constructor(
    @InjectModel(allowance.name)
    allowanceModel: Model<allowanceDocument>,
  ) {
    super(allowanceModel);
  }
}

@Injectable()
export class CompanyWideSettingsRepository extends BaseRepository<CompanyWideSettingsDocument> {
  constructor(
    @InjectModel(CompanyWideSettings.name)
    companyWideSettingsModel: Model<CompanyWideSettingsDocument>,
  ) {
    super(companyWideSettingsModel);
  }
}

@Injectable()
export class InsuranceBracketsRepository extends BaseRepository<insuranceBracketsDocument> {
  constructor(
    @InjectModel(insuranceBrackets.name)
    insuranceBracketsModel: Model<insuranceBracketsDocument>,
  ) {
    super(insuranceBracketsModel);
  }
}

@Injectable()
export class PayGradeRepository extends BaseRepository<payGradeDocument> {
  constructor(
    @InjectModel(payGrade.name)
    payGradeModel: Model<payGradeDocument>,
  ) {
    super(payGradeModel);
  }
}

@Injectable()
export class PayrollPoliciesRepository extends BaseRepository<payrollPoliciesDocument> {
  constructor(
    @InjectModel(payrollPolicies.name)
    payrollPoliciesModel: Model<payrollPoliciesDocument>,
  ) {
    super(payrollPoliciesModel);
  }
}

@Injectable()
export class PayTypeRepository extends BaseRepository<payTypeDocument> {
  constructor(
    @InjectModel(payType.name)
    payTypeModel: Model<payTypeDocument>,
  ) {
    super(payTypeModel);
  }
}

@Injectable()
export class SigningBonusRepository extends BaseRepository<signingBonusDocument> {
  constructor(
    @InjectModel(signingBonus.name)
    signingBonusModel: Model<signingBonusDocument>,
  ) {
    super(signingBonusModel);
  }
}

@Injectable()
export class TaxRulesRepository extends BaseRepository<taxRulesDocument> {
  constructor(
    @InjectModel(taxRules.name)
    taxRulesModel: Model<taxRulesDocument>,
  ) {
    super(taxRulesModel);
  }
}

@Injectable()
export class TerminationBenefitsRepository extends BaseRepository<terminationAndResignationBenefitsDocument> {
  constructor(
    @InjectModel(terminationAndResignationBenefits.name)
    terminationBenefitsModel: Model<terminationAndResignationBenefitsDocument>,
  ) {
    super(terminationBenefitsModel);
  }
}
