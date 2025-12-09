import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { SystemRole } from '../../employee-subsystem/employee/enums/employee-profile.enums';

dotenv.config();

/**
 * Generate a test JWT token for Postman testing
 * 
 * Usage:
 *   npm run generate-token <employeeId> <role>
 * 
 * Examples:
 *   npm run generate-token 692c6d333e79cea9412f42df Employee
 *   npm run generate-token 692c6d333e79cea9412f42e2 Payroll_Specialist
 *   npm run generate-token 692c6d333e79cea9412f42e8 Finance_Staff
 *   npm run generate-token 692c6d343e79cea9412f42eb Manager
 */

const employeeId = process.argv[2];
const roleInput = process.argv[3] || 'Employee';

// Map role input to SystemRole enum value to ensure exact match
// Supports both underscore format (Employee, Payroll_Specialist) and enum format (DEPARTMENT_EMPLOYEE)
const roleMap: Record<string, SystemRole> = {
  // User-friendly format (as provided in documentation)
  'Employee': SystemRole.DEPARTMENT_EMPLOYEE,
  'Payroll_Specialist': SystemRole.PAYROLL_SPECIALIST,
  'Finance_Staff': SystemRole.FINANCE_STAFF,
  'Manager': SystemRole.DEPARTMENT_HEAD,
  'Payroll_Manager': SystemRole.PAYROLL_MANAGER,
  // Enum format (all caps with underscores)
  'DEPARTMENT_EMPLOYEE': SystemRole.DEPARTMENT_EMPLOYEE,
  'DEPARTMENT_HEAD': SystemRole.DEPARTMENT_HEAD,
  'HR_MANAGER': SystemRole.HR_MANAGER,
  'HR_EMPLOYEE': SystemRole.HR_EMPLOYEE,
  'HR_ADMIN': SystemRole.HR_ADMIN,
  'PAYROLL_SPECIALIST': SystemRole.PAYROLL_SPECIALIST,
  'PAYROLL_MANAGER': SystemRole.PAYROLL_MANAGER,
  'FINANCE_STAFF': SystemRole.FINANCE_STAFF,
  'SYSTEM_ADMIN': SystemRole.SYSTEM_ADMIN,
  'LEGAL_POLICY_ADMIN': SystemRole.LEGAL_POLICY_ADMIN,
  'RECRUITER': SystemRole.RECRUITER,
};

const role = roleMap[roleInput] || SystemRole.DEPARTMENT_EMPLOYEE;

if (!roleMap[roleInput]) {
  console.warn(`⚠️  Warning: Role "${roleInput}" not found in role map. Using default: ${SystemRole.DEPARTMENT_EMPLOYEE}`);
  console.warn(`   Available roles: Employee, Payroll_Specialist, Finance_Staff, Manager, DEPARTMENT_EMPLOYEE, etc.`);
}

if (!employeeId) {
  console.error('❌ Error: Employee ID is required');
  console.log('\nUsage:');
  console.log('  ts-node -r tsconfig-paths/register src/payroll/tracking/generate-test-token.ts <employeeId> <role>');
  console.log('\nAvailable roles (user-friendly format):');
  console.log('  - Employee (default)');
  console.log('  - Payroll_Specialist');
  console.log('  - Finance_Staff');
  console.log('  - Manager');
  console.log('  - Payroll_Manager');
  console.log('\nAvailable roles (enum format):');
  console.log('  - DEPARTMENT_EMPLOYEE, DEPARTMENT_HEAD');
  console.log('  - PAYROLL_SPECIALIST, PAYROLL_MANAGER');
  console.log('  - FINANCE_STAFF, HR_MANAGER, HR_EMPLOYEE, etc.');
  console.log('\nExamples:');
  console.log('  npm run generate-token 692c6d333e79cea9412f42df Employee');
  console.log('  npm run generate-token 692c6d333e79cea9412f42e2 Payroll_Specialist');
  console.log('  npm run generate-token 692c6d333e79cea9412f42e8 Finance_Staff');
  process.exit(1);
}

const secret = process.env.JWT_SECRET;

if (!secret) {
  console.error('❌ Error: JWT_SECRET not found in environment variables');
  process.exit(1);
}

// JWT payload structure that matches what the guards and controllers expect
const payload = {
  userid: employeeId, // Controller expects req['user'].userid
  sub: employeeId,    // Auth service uses sub as user ID
  role: role,         // Authorization guard expects user.role (SystemRole)
  email: `test-${employeeId}@example.com`, // For consistency with auth service
  userType: 'employee', // For consistency with auth service
};

const token = jwt.sign(payload, secret, { expiresIn: '60m' });

console.log('\n✅ JWT Token Generated Successfully!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Token:');
console.log(token);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📋 Token Details:');
console.log(`   Employee ID: ${employeeId}`);
console.log(`   Role: ${role} (${roleInput})`);
console.log(`   Expires: 60 minutes`);
console.log('\n💡 Use this token in Postman:');
console.log(`   1. Go to Authorization tab`);
console.log(`   2. Type: Bearer Token`);
console.log(`   3. Token: ${token}`);
console.log(`\n   Or add to Headers:`);
console.log(`   Key: Authorization`);
console.log(`   Value: Bearer ${token}`);
console.log('\n');

