import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { PayRollStatus, PayRollPaymentStatus, PaySlipPaymentStatus } from '../execution/enums/payroll-execution-enum';
import { ConfigStatus } from '../config_setup/enums/payroll-configuration-enums';

dotenv.config();

/**
 * Script to create test data for REQ-PY-25 (Tax/Insurance/Benefits Reports)
 * 
 * Creates:
 * - An approved payroll run for 2024
 * - Payslips with taxes, insurances, and benefits
 * 
 * Usage:
 *   npm run create-payroll-run-with-tax-data <employeeId> <payrollSpecialistId> <payrollManagerId>
 * 
 * Example:
 *   npm run create-payroll-run-with-tax-data 692c6d333e79cea9412f42df 692c6d333e79cea9412f42e2 692c6d343e79cea9412f42eb
 */

const employeeId = process.argv[2];
const payrollSpecialistId = process.argv[3];
const payrollManagerId = process.argv[4];

if (!employeeId || !payrollSpecialistId || !payrollManagerId) {
  console.error('❌ Error: Employee ID, Payroll Specialist ID, and Payroll Manager ID are required');
  console.log('\nUsage:');
  console.log('  npm run create-payroll-run-with-tax-data <employeeId> <payrollSpecialistId> <payrollManagerId>');
  console.log('\nExample:');
  console.log('  npm run create-payroll-run-with-tax-data 692c6d333e79cea9412f42df 692c6d333e79cea9412f42e2 692c6d343e79cea9412f42eb');
  process.exit(1);
}

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('❌ Error: MONGO_URI not found in environment variables');
  process.exit(1);
}

async function createPayrollRunWithTaxData() {
  const conn = await mongoose.createConnection(mongoUri!);
  console.log('✅ Connected to MongoDB');

  try {
    // Wait for connection to be ready
    await new Promise((resolve) => {
      if (conn.readyState === 1) {
        resolve(undefined);
      } else {
        conn.once('connected', resolve);
      }
    });

    const db = conn.getClient().db();

    // Create an approved payroll run for December 2024 with unique runId
    const payrollPeriod = new Date(2024, 11, 31); // December 31, 2024
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);
    const runId = `PR-2024-12-${timestamp}-${randomSuffix}`;

    const payrollRunData: any = {
      runId: runId,
      payrollPeriod: payrollPeriod,
      status: PayRollStatus.APPROVED,
      entity: 'Test Company',
      employees: 1,
      exceptions: 0,
      totalnetpay: 4200,
      payrollSpecialistId: new mongoose.Types.ObjectId(payrollSpecialistId),
      payrollManagerId: new mongoose.Types.ObjectId(payrollManagerId),
      paymentStatus: PayRollPaymentStatus.PENDING,
      managerApprovalDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert using native MongoDB to avoid schema/index validation issues
    const payrollRunsCollection = db.collection('payrollruns');
    const insertResult = await payrollRunsCollection.insertOne(payrollRunData);
    const savedPayrollRunId = insertResult.insertedId;
    
    if (!insertResult.insertedId) {
      throw new Error('Failed to create payroll run');
    }
    
    // Use native MongoDB for payslip too to avoid connection issues
    const payslipsCollection = db.collection('payslips');

    console.log(`✅ Created approved payroll run: ${savedPayrollRunId.toString()}`);
    console.log(`   Run ID: ${runId}`);
    console.log(`   Period: ${payrollPeriod.toISOString()}`);

    // Create payslip with taxes, insurances, and benefits
    const baseSalary = 5000;
    const grossSalary = 5500;
    
    // Delete ALL payslips with null allowances.name to avoid unique index conflicts
    try {
      const allPayslips = await payslipsCollection.find({}).toArray();
      const payslipsWithNullAllowances = allPayslips.filter(p => 
        !p.earningsDetails?.allowances || 
        p.earningsDetails.allowances.length === 0 ||
        p.earningsDetails.allowances.some((a: any) => !a || !a.name)
      );
      
      if (payslipsWithNullAllowances.length > 0) {
        const idsToDelete = payslipsWithNullAllowances.map(p => p._id);
        const deleteResult = await payslipsCollection.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} payslip(s) with null/empty allowances to avoid index conflicts`);
      }
    } catch (cleanupError) {
      console.log('⚠️  Could not clean up payslips, continuing...');
    }
    
    // Also delete existing payslips for this specific employee
    const deleteResult = await payslipsCollection.deleteMany({
      employeeId: new mongoose.Types.ObjectId(employeeId),
    });
    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing payslip(s) for this employee`);
    }

    const payslipData: any = {
      employeeId: new mongoose.Types.ObjectId(employeeId),
      payrollRunId: savedPayrollRunId,
      earningsDetails: {
        baseSalary: baseSalary,
        // Omit allowances field to avoid unique index conflicts on empty arrays
        bonuses: [],
        benefits: [
          {
            name: 'Health Insurance Benefit',
            amount: 300,
            terms: 'Monthly health insurance coverage',
            status: ConfigStatus.APPROVED,
          },
          {
            name: 'Transportation Benefit',
            amount: 200,
            terms: 'Monthly transportation allowance',
            status: ConfigStatus.APPROVED,
          },
        ],
        refunds: [],
      },
      deductionsDetails: {
        taxes: [
          {
            name: 'Income Tax',
            description: 'Federal income tax',
            rate: 15,
            status: ConfigStatus.APPROVED,
          },
          {
            name: 'Social Security Tax',
            description: 'Social security contribution',
            rate: 5,
            status: ConfigStatus.APPROVED,
          },
        ],
        insurances: [
          {
            name: 'Health Insurance',
            amount: 200,
            minSalary: 1000,
            maxSalary: 10000,
            employeeRate: 3,
            employerRate: 5,
            status: ConfigStatus.APPROVED,
          },
          {
            name: 'Life Insurance',
            amount: 100,
            minSalary: 1000,
            maxSalary: 10000,
            employeeRate: 1,
            employerRate: 2,
            status: ConfigStatus.APPROVED,
          },
        ],
      },
      totalGrossSalary: grossSalary,
      totaDeductions: 1300,
      netPay: 4200,
      paymentStatus: PaySlipPaymentStatus.PENDING,
    };

    // Insert payslip using native MongoDB
    const payslipDataWithTimestamps = {
      ...payslipData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const payslipInsertResult = await payslipsCollection.insertOne(payslipDataWithTimestamps);
    const savedPayslipId = payslipInsertResult.insertedId;
    
    if (!savedPayslipId) {
      throw new Error('Failed to create payslip');
    }

    console.log('\n✅ Created payslip with tax/insurance/benefit data:');
    console.log(`   Payslip ID: ${savedPayslipId.toString()}`);
    console.log(`   Base Salary: ${baseSalary}`);
    console.log(`   Gross Salary: ${grossSalary}`);
    console.log(`   Net Pay: ${payslipData.netPay}`);
    console.log(`   Taxes: ${payslipData.deductionsDetails.taxes.length} entries`);
    console.log(`   Insurances: ${payslipData.deductionsDetails.insurances.length} entries`);
    console.log(`   Benefits: ${payslipData.earningsDetails.benefits.length} entries`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Test Data Created Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Now you can test REQ-PY-25 with:');
    console.log(`   Year: 2024`);
    console.log(`   Document Type: Annual Tax Statement (or Monthly/Quarterly)`);
    console.log(`   Payroll Run ID: ${savedPayrollRunId.toString()}`);
    console.log('\n');

    await conn.close();
    console.log('✅ Disconnected from MongoDB');
  } catch (error: any) {
    console.error('❌ Error creating payroll run with tax data:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - payroll run might already exist');
      console.error('\n💡 To fix this issue, run: npm run fix-payroll-runs');
    }
    await conn.close().catch(() => {});
    process.exit(1);
  }
}

createPayrollRunWithTaxData();

