import * as dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

const employeeId = process.argv[2];

if (!employeeId) {
  console.error('❌ Error: Employee ID is required');
  console.log('\nUsage:');
  console.log('  npm run get-department-id <employeeId>');
  console.log('\nExample:');
  console.log('  npm run get-department-id 692c6d333e79cea9412f42df');
  process.exit(1);
}

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('❌ Error: MONGO_URI not found in environment variables');
  process.exit(1);
}

async function getDepartmentId() {
  let conn: MongoClient | undefined;
  try {
    conn = await MongoClient.connect(mongoUri!);
    const db = conn.db();
    console.log('✅ Connected to MongoDB\n');

    const employeeProfilesCollection = db.collection('employee_profiles');
    const departmentsCollection = db.collection('departments');

    // Find employee by ID
    const employee = await employeeProfilesCollection.findOne({
      _id: new ObjectId(employeeId),
    });

    if (!employee) {
      console.error(`❌ Employee not found with ID: ${employeeId}`);
      process.exit(1);
    }

    console.log(`✅ Employee found: ${employee.firstName || ''} ${employee.lastName || ''}`);
    console.log(`   Employee Number: ${employee.employeeNumber || 'N/A'}\n`);

    // Check if employee has a department
    if (!employee.primaryDepartmentId) {
      console.warn('⚠️  Employee does not have a primaryDepartmentId assigned');
      console.log('\n📋 Listing all available departments:\n');
      
      const departments = await departmentsCollection.find({ isActive: true }).toArray();
      if (departments.length === 0) {
        console.log('   No active departments found in database');
      } else {
        departments.forEach((dept: any) => {
          console.log(`   Department ID: ${dept._id.toString()}`);
          console.log(`   Name: ${dept.name || 'N/A'}`);
          console.log(`   Code: ${dept.code || 'N/A'}`);
          console.log('');
        });
        console.log('💡 Use one of the Department IDs above in your request body');
      }
    } else {
      const departmentId = employee.primaryDepartmentId.toString();
      console.log(`📁 Employee's Primary Department ID: ${departmentId}`);

      // Fetch department details
      const department = await departmentsCollection.findOne({
        _id: new ObjectId(departmentId),
      });

      if (department) {
        console.log(`   Department Name: ${department.name || 'N/A'}`);
        console.log(`   Department Code: ${department.code || 'N/A'}`);
      } else {
        console.warn(`   ⚠️  Department not found (may have been deleted)`);
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Use this Department ID in your request:');
      console.log(`   "${departmentId}"`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Cast to ObjectId failed')) {
      console.error(`   Invalid employee ID format: ${employeeId}`);
      console.error('   Employee ID must be a valid MongoDB ObjectId (24 hex characters)');
    }
    process.exit(1);
  } finally {
    if (conn) {
      await conn.close().catch(() => {});
      console.log('✅ Disconnected from MongoDB');
    }
  }
}

getDepartmentId();

