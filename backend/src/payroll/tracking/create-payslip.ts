import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { paySlipSchema } from '../execution/models/payslip.schema';
import { PaySlipPaymentStatus } from '../execution/enums/payroll-execution-enum';

dotenv.config();

/**
 * Script to create a test payslip for an employee
 * 
 * Usage:
 *   ts-node -r tsconfig-paths/register src/payroll/tracking/create-payslip.ts <employeeId> <payrollRunId>
 * 
 * Example:
 *   ts-node -r tsconfig-paths/register src/payroll/tracking/create-payslip.ts 692c6d333e79cea9412f42df 692c6d343e79cea9412f42fe
 */

const employeeId = process.argv[2];
const payrollRunId = process.argv[3] || new mongoose.Types.ObjectId().toString(); // Generate new if not provided

if (!employeeId) {
  console.error('❌ Error: Employee ID is required');
  console.log('\nUsage:');
  console.log('  ts-node -r tsconfig-paths/register src/payroll/tracking/create-payslip.ts <employeeId> [payrollRunId]');
  console.log('\nExample:');
  console.log('  ts-node -r tsconfig-paths/register src/payroll/tracking/create-payslip.ts 692c6d333e79cea9412f42df');
  console.log('  ts-node -r tsconfig-paths/register src/payroll/tracking/create-payslip.ts 692c6d333e79cea9412f42df 692c6d343e79cea9412f42fe');
  process.exit(1);
}

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('❌ Error: MONGO_URI not found in environment variables');
  process.exit(1);
}

async function createPayslip() {
  try {
    // Connect to MongoDB (mongoUri is already validated above)
    await mongoose.connect(mongoUri!);
    console.log('✅ Connected to MongoDB');

    // Create model
    const PayslipModel = mongoose.model('paySlip', paySlipSchema);

    // Delete any existing payslips for this employee to avoid unique index conflicts
    const employeeObjectId = new mongoose.Types.ObjectId(employeeId);
    const deleteResult = await PayslipModel.deleteMany({ employeeId: employeeObjectId });
    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing payslip(s) for this employee`);
    }

    // Generate a new payroll run ID to ensure uniqueness
    const newPayrollRunId = new mongoose.Types.ObjectId();
    const finalPayrollRunId = payrollRunId ? new mongoose.Types.ObjectId(payrollRunId) : newPayrollRunId;
    
    console.log('📝 Using Payroll Run ID:', finalPayrollRunId.toString());

    // Create payslip with unique values
    const timestamp = Date.now();
    const payslipData = {
      employeeId: new mongoose.Types.ObjectId(employeeId),
      payrollRunId: finalPayrollRunId,
      earningsDetails: {
        baseSalary: 5500 + (timestamp % 1000), // Add variation based on timestamp
        allowances: [], // Empty array - no unique index conflicts
        bonuses: [],
        benefits: [],
        refunds: [],
      },
      deductionsDetails: {
        taxes: [],
        insurances: [],
        penalties: undefined,
      },
      totalGrossSalary: 5500 + (timestamp % 1000),
      totaDeductions: 1300 + (timestamp % 100), // Different deductions
      netPay: 4200 + (timestamp % 900),
      paymentStatus: PaySlipPaymentStatus.PENDING,
    };

    const payslip = new PayslipModel(payslipData);
    const savedPayslip = await payslip.save();

    console.log('\n✅ Payslip Created Successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Payslip ID:', savedPayslip._id.toString());
    console.log('Employee ID:', employeeId);
    console.log('Payroll Run ID:', finalPayrollRunId.toString());
    console.log('Base Salary:', payslipData.earningsDetails.baseSalary);
    console.log('Gross Salary:', payslipData.totalGrossSalary);
    console.log('Total Deductions:', payslipData.totaDeductions);
    console.log('Net Pay:', payslipData.netPay);
    console.log('Payment Status:', payslipData.paymentStatus);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 Use this payslip ID in your dispute request:');
    console.log(`   "payslip_id": "${savedPayslip._id.toString()}"\n`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error creating payslip:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - payslip might already exist');
    }
    process.exit(1);
  }
}

createPayslip();

