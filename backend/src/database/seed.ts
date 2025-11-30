import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import {
  ShiftAssignmentStatus,
  PunchPolicy,
  HolidayType,
  PunchType,
  CorrectionRequestStatus,
  TimeExceptionType,
  TimeExceptionStatus,
} from '../time-mangement/models/enums';
import { config } from 'dotenv';

// Load env
config({ path: process.cwd() + '/.env' });

const SRC_DIR = path.resolve(__dirname, '../src');

async function connect() {
  // Use the same configuration approach as database.module.ts
  // Check for test environment first, then fallback to MONGO_URI or default
  const isTest = process.env.NODE_ENV === 'test';
  const uri = isTest
    ? 'mongodb://localhost:27017/payroll-test'
    : process.env.MONGO_URI || 'mongodb://localhost:27017/payroll-subsystems';
  
  console.log(`Connecting to: ${uri.replace(/\/\/[^@]*@/, '//***:***@')}`); // Hide credentials in log
  return mongoose.connect(uri);
}

function findSchemaFiles(dir: string, out: string[] = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) findSchemaFiles(full, out);
    else if (e.isFile() && e.name.endsWith('.schema.ts')) out.push(full);
  }
  return out;
}

function generateValueForPath(pathType: any, modelName: string, idx: number) {
  const inst =
    (pathType &&
      (pathType.instance || (pathType.caster && pathType.caster.instance))) ||
    'Mixed';
  const field = (pathType && (pathType.path || pathType.pathName)) || 'field';
  if (pathType && pathType.options && pathType.options.ref)
    return new mongoose.Types.ObjectId();

  switch (inst) {
    case 'String': {
      if (/^conditions$/i.test(field)) return 'Offer conditions 1';
      if (/^insurances$/i.test(field)) return ['Offer insurances 1'];
      if (/^content$/i.test(field)) return 'Offer content 1';
      if (/name|title|fullName|label/i.test(field))
        return `${modelName} ${idx}`;
      if (
        /code|codeNumber|code_id|number|employeeNumber|employeeNo/i.test(field)
      )
        return `${modelName}-${idx}`;
      if (/email/i.test(field))
        return `${modelName.toLowerCase()}.${idx}@example.com`;
      if (/phone|mobile|tel|contact/i.test(field))
        return `+1000000${100 + idx}`;
      if (/description|note|message|reason/i.test(field))
        return `${modelName} ${field} description ${idx}`;
      if (/start|end|time|date/i.test(field)) return new Date().toISOString();
      if (/status|type|category/i.test(field)) return `${field.toUpperCase()}`;
      return `${modelName} ${field} ${idx}`;
    }
    case 'Number':
      return idx;
    case 'Date':
      return new Date();
    case 'Boolean':
      return idx % 2 === 0;
    case 'ObjectID':
      return new mongoose.Types.ObjectId();
    case 'Array':
      return [];
    default:
      return {};
  }
}

function generateEmployeeProfile(
  idx: number,
  schemaPaths: any,
  _createdIds: Record<string, any[]>,
) {
  const firstNames = [
    'John',
    'Jane',
    'Alice',
    'Bob',
    'Carlos',
    'Fatima',
    'Lina',
    'Mohamed',
  ];
  const lastNames = [
    'Doe',
    'Smith',
    'Johnson',
    'Khan',
    'Ali',
    'Garcia',
    'Nguyen',
    'Patel',
  ];
  const firstName = firstNames[(idx - 1) % firstNames.length];
  const lastName = lastNames[(idx - 1) % lastNames.length];
  const employeeNumber = `EMP${String(100 + idx).slice(1)}`; // EMP01, EMP02...
  const nationalId = String(1000000000 + Math.floor(Math.random() * 900000000));
  const dateOfHire = new Date(2018 + (idx % 6), 0, 1);
  const status = 'ACTIVE';

  const doc: any = {};
  for (const p of Object.keys(schemaPaths)) {
    if (['_id', '__v'].includes(p)) continue;
    switch (p) {
      case 'firstName':
        doc[p] = firstName;
        break;
      case 'middleName':
        doc[p] = '';
        break;
      case 'lastName':
        doc[p] = lastName;
        break;
      case 'fullName':
        doc[p] = `${firstName} ${lastName}`;
        break;
      case 'nationalId':
        doc[p] = nationalId;
        break;
      case 'employeeNumber':
        doc[p] = employeeNumber;
        break;
      case 'dateOfHire':
        doc[p] = dateOfHire;
        break;
      case 'status':
        doc[p] = status;
        break;
      case 'statusEffectiveFrom':
      case 'createdAt':
      case 'updatedAt':
        doc[p] = new Date();
        break;
      case 'personalEmail':
      case 'workEmail':
        doc[p] =
          `${firstName.toLowerCase()}.${lastName.toLowerCase()}${idx}@example.com`;
        break;
      default:
        // for refs, reuse generation logic
        const pathType = schemaPaths[p];
        if (pathType && pathType.options && pathType.options.ref) {
          doc[p] = new mongoose.Types.ObjectId();
        } else {
          doc[p] = generateValueForPath(pathType, 'EmployeeProfile', idx);
        }
    }
  }

  return doc;
}

function generateDepartment(
  idx: number,
  schemaPaths: any,
  _createdIds: Record<string, any[]>,
) {
  const names = [
    'Engineering',
    'HR',
    'Finance',
    'Sales',
    'Marketing',
    'Operations',
  ];
  const name =
    names[(idx - 1) % names.length] + (idx > names.length ? ` ${idx}` : '');
  const code = `DEP-${100 + idx}`;
  const doc: any = {};
  for (const p of Object.keys(schemaPaths)) {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(p)) continue;
    switch (p) {
      case 'name':
        doc[p] = name;
        break;
      case 'departmentCode':
        doc[p] = code;
        break;
      case 'description':
        doc[p] = `${name} department`;
        break;
      default:
        const pathType = schemaPaths[p];
        if (pathType && pathType.options && pathType.options.ref)
          doc[p] = new mongoose.Types.ObjectId();
        else doc[p] = generateValueForPath(pathType, 'Department', idx);
    }
  }
  return doc;
}

function generatePosition(
  idx: number,
  schemaPaths: any,
  createdIds: Record<string, any[]>,
) {
  const titles = ['Developer', 'Manager', 'Analyst', 'Designer', 'Engineer'];
  const title = titles[(idx - 1) % titles.length];
  const code = `POS-${200 + idx}`;
  const doc: any = {};
  for (const p of Object.keys(schemaPaths)) {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(p)) continue;
    switch (p) {
      case 'title':
        doc[p] = title;
        break;
      case 'code':
        doc[p] = code;
        break;
      default:
        const pathType = schemaPaths[p];
        if (pathType && pathType.options && pathType.options.ref) {
          // prefer Department if available
          doc[p] =
            createdIds['Department'] && createdIds['Department'][0]
              ? createdIds['Department'][0]
              : new mongoose.Types.ObjectId();
        } else doc[p] = generateValueForPath(pathType, 'Position', idx);
    }
  }
  return doc;
}

function generateShiftType(idx: number, schemaPaths: any) {
  const names = ['Morning', 'Evening', 'Night', 'Flexible'];
  const name = names[(idx - 1) % names.length];
  const start = new Date();
  const end = new Date(start.getTime() + 1000 * 60 * 60 * 8);
  const doc: any = {};
  for (const p of Object.keys(schemaPaths)) {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(p)) continue;
    switch (p) {
      case 'name':
        doc[p] = name;
        break;
      case 'code':
        doc[p] = `ST-${idx}`;
        break;
      case 'startTime':
        doc[p] = start;
        break;
      case 'endTime':
        doc[p] = end;
        break;
      case 'isRotational':
        doc[p] = idx % 2 === 0;
        break;
      default:
        doc[p] = generateValueForPath(schemaPaths[p], 'ShiftType', idx);
    }
  }
  return doc;
}

function generateShift(
  idx: number,
  schemaPaths: any,
  createdIds: Record<string, any[]>,
) {
  const doc: any = {};
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 1000 * 60 * 60 * 24);
  for (const p of Object.keys(schemaPaths)) {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(p)) continue;
    switch (p) {
      case 'name':
        doc[p] = `Shift ${idx}`;
        break;
      case 'startDate':
        doc[p] = startDate;
        break;
      case 'endDate':
        doc[p] = endDate;
        break;
      case 'shiftType':
        if (createdIds['ShiftType'] && createdIds['ShiftType'][0])
          doc[p] = createdIds['ShiftType'][0];
        else doc[p] = new mongoose.Types.ObjectId();
        break;
      default:
        const pathType = schemaPaths[p];
        if (pathType && pathType.options && pathType.options.ref)
          doc[p] = new mongoose.Types.ObjectId();
        else doc[p] = generateValueForPath(pathType, 'Shift', idx);
    }
  }
  return doc;
}

function generateShiftAssignment(
  idx: number,
  schemaPaths: any,
  createdIds: Record<string, any[]>,
) {
  const doc: any = {};
  const date = new Date();
  for (const p of Object.keys(schemaPaths)) {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(p)) continue;
    switch (p) {
      case 'date':
        doc[p] = date;
        break;
      case 'employee':
        doc[p] =
          createdIds['EmployeeProfile'] && createdIds['EmployeeProfile'][0]
            ? createdIds['EmployeeProfile'][0]
            : new mongoose.Types.ObjectId();
        break;
      case 'shift':
        doc[p] =
          createdIds['Shift'] && createdIds['Shift'][0]
            ? createdIds['Shift'][0]
            : new mongoose.Types.ObjectId();
        break;
      case 'status':
        doc[p] = ShiftAssignmentStatus.PENDING;
        break;
      default:
        const pathType = schemaPaths[p];
        if (pathType && pathType.options && pathType.options.ref)
          doc[p] = new mongoose.Types.ObjectId();
        else doc[p] = generateValueForPath(pathType, 'ShiftAssignment', idx);
    }
  }
  return doc;
}

function generateLeaveType(idx: number, schemaPaths: any) {
  const names = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Unpaid'];
  const name = names[(idx - 1) % names.length];
  const code = `LT-${idx}`;
  const doc: any = {};
  for (const p of Object.keys(schemaPaths)) {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(p)) continue;
    switch (p) {
      case 'name':
        doc[p] = name;
        break;
      case 'code':
        doc[p] = code;
        break;
      case 'defaultEntitlement':
        doc[p] = 14;
        break;
      case 'isPaid':
        doc[p] = p.toLowerCase().includes('sick') ? true : true;
        break;
      default:
        doc[p] = generateValueForPath(schemaPaths[p], 'LeaveType', idx);
    }
  }
  return doc;
}

function generateLeavePolicy(
  idx: number,
  schemaPaths: any,
  createdIds: Record<string, any[]>,
) {
  const doc: any = {};
  for (const p of Object.keys(schemaPaths)) {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(p)) continue;
    if (p === 'name') doc[p] = `Default Leave Policy ${idx}`;
    else if (p === 'leaveType')
      doc[p] =
        createdIds['LeaveType'] && createdIds['LeaveType'][0]
          ? createdIds['LeaveType'][0]
          : new mongoose.Types.ObjectId();
    else doc[p] = generateValueForPath(schemaPaths[p], 'LeavePolicy', idx);
  }
  return doc;
}

function generateCandidate(idx: number, schemaPaths: any) {
  const first = ['Anna', 'Liam', 'Noah', 'Olivia', 'Emma'][idx % 5];
  const last = ['Brown', 'Wilson', 'Lee', 'Martin', 'Clark'][idx % 5];
  const doc: any = {};
  for (const p of Object.keys(schemaPaths)) {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(p)) continue;
    switch (p) {
      case 'firstName':
        doc[p] = first;
        break;
      case 'lastName':
        doc[p] = last;
        break;
      case 'email':
        doc[p] =
          `${first.toLowerCase()}.${last.toLowerCase()}${idx}@example.com`;
        break;
      case 'status':
        doc[p] = 'APPLIED';
        break;
      case 'appliedAt':
        doc[p] = new Date();
        break;
      default:
        doc[p] = generateValueForPath(schemaPaths[p], 'Candidate', idx);
    }
  }
  return doc;
}

function generateNotification(
  idx: number,
  schemaPaths: any,
  createdIds: Record<string, any[]>,
) {
  const doc: any = {};
  for (const p of Object.keys(schemaPaths)) {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(p)) continue;
    switch (p) {
      case 'title':
        doc[p] = `Notice ${idx}`;
        break;
      case 'message':
        doc[p] = `This is a seeded notification ${idx}`;
        break;
      case 'recipient':
        doc[p] =
          createdIds['EmployeeProfile'] && createdIds['EmployeeProfile'][0]
            ? createdIds['EmployeeProfile'][0]
            : new mongoose.Types.ObjectId();
        break;
      case 'read':
        doc[p] = false;
        break;
      default:
        doc[p] = generateValueForPath(schemaPaths[p], 'Notification', idx);
    }
  }
  return doc;
}

function generateCalendar(idx: number, schemaPaths: any) {
  const doc: any = {};
  for (const p of Object.keys(schemaPaths)) {
    if (['_id', '__v', 'createdAt', 'updatedAt'].includes(p)) continue;
    if (p === 'name') doc[p] = `Calendar ${new Date().getFullYear()}`;
    else if (p === 'year') doc[p] = new Date().getFullYear();
    else if (p === 'events') doc[p] = [];
    else doc[p] = generateValueForPath(schemaPaths[p], 'Calendar', idx);
  }
  return doc;
}

function generateDocumentForModel(
  name: string,
  idx: number,
  schemaPaths: any,
  createdIds: Record<string, any[]>,
) {
  switch (name) {
    case 'EmployeeProfile':
      return generateEmployeeProfile(idx, schemaPaths, createdIds);
    case 'Department':
      return generateDepartment(idx, schemaPaths, createdIds);
    case 'Position':
      return generatePosition(idx, schemaPaths, createdIds);
    case 'ShiftType':
      return generateShiftType(idx, schemaPaths);
    case 'Shift':
      return generateShift(idx, schemaPaths, createdIds);
    case 'ShiftAssignment':
      return generateShiftAssignment(idx, schemaPaths, createdIds);
    case 'LeaveType':
      return generateLeaveType(idx, schemaPaths);
    case 'LeavePolicy':
      return generateLeavePolicy(idx, schemaPaths, createdIds);
    case 'Candidate':
      return generateCandidate(idx, schemaPaths);
    case 'Notification':
      return generateNotification(idx, schemaPaths, createdIds);
    case 'Calendar':
      return generateCalendar(idx, schemaPaths);
    default:
      // fallback to generic generation
      const doc: any = {};
      for (const p of Object.keys(schemaPaths)) {
        if (['_id', '__v', 'createdAt', 'updatedAt'].includes(p)) continue;
        const pathType = schemaPaths[p];
        if (pathType && pathType.options && pathType.options.ref) {
          const ref = pathType.options.ref as string;
          if (createdIds[ref] && createdIds[ref].length)
            doc[p] = createdIds[ref][0];
          else doc[p] = new mongoose.Types.ObjectId();
        } else doc[p] = generateValueForPath(pathType, name, idx);
      }
      return doc;
  }
}

function applyEnumHints(
  modelName: string,
  doc: any,
  _schemaPaths: any,
  idx: number,
) {
  // ShiftAssignment status
  if (modelName === 'ShiftAssignment' && 'status' in doc) {
    doc.status = ShiftAssignmentStatus.PENDING;
  }

  // punchPolicy on Shift or ShiftType-like models
  if ('punchPolicy' in doc) {
    // alternate between values for variety
    const policies = [
      PunchPolicy.MULTIPLE,
      PunchPolicy.FIRST_LAST,
      PunchPolicy.ONLY_FIRST,
    ];
    doc.punchPolicy = policies[idx % policies.length];
  }

  // holiday type
  if ('holidayType' in doc) {
    doc.holidayType = HolidayType.NATIONAL;
  }

  // punch type
  if ('punchType' in doc) {
    doc.punchType = idx % 2 === 0 ? PunchType.IN : PunchType.OUT;
  }

  // Correction / CorrectionRequest status
  if (modelName.toLowerCase().includes('correction') && 'status' in doc) {
    doc.status = CorrectionRequestStatus.SUBMITTED;
  }

  // TimeException fields
  if (
    modelName.toLowerCase().includes('timeexception') ||
    modelName.toLowerCase().includes('time_exception')
  ) {
    if ('type' in doc) doc.type = TimeExceptionType.MISSED_PUNCH;
    if ('status' in doc) doc.status = TimeExceptionStatus.OPEN;
  }

  return doc;
}

async function run() {
  console.log('Connecting to MongoDB...');
  await connect();

  const schemaFiles = findSchemaFiles(SRC_DIR);
  console.log(`Found ${schemaFiles.length} schema files.`);

  const models: Record<string, mongoose.Model<any>> = {};

  // Register all schemas as models
  for (const file of schemaFiles) {
    try {
      const mod = require(file);
      for (const key of Object.keys(mod)) {
        if (key.endsWith('Schema')) {
          const modelName = key.replace(/Schema$/, '');
          const schema = mod[key];
          if (!models[modelName]) {
            models[modelName] =
              mongoose.models[modelName] || mongoose.model(modelName, schema);
            console.log(
              'Registered model:',
              modelName,
              'from',
              path.relative(process.cwd(), file),
            );
          }
        }
      }
    } catch (err) {
      console.warn('Skipping file (require failed):', file, err.message);
    }
  }

  // For each model create 3 dummy documents
  const createdIds: Record<string, any[]> = {};
  for (const [name, model] of Object.entries(models)) {
    createdIds[name] = [];
    try {
      // determine unique-indexed fields to avoid duplicate key errors
      const uniqueFields = new Set<string>();
      try {
        const idxs = model.schema.indexes();
        for (const [idxSpec, idxOptions] of idxs) {
          if (idxOptions && idxOptions.unique) {
            Object.keys(idxSpec).forEach((k) => uniqueFields.add(k));
          }
        }
      } catch (e) {
        // ignore if indexes() not available
      }

      for (let i = 1; i <= 3; i++) {
        const schemaPaths = model.schema.paths;
        // build document using specialized generators when available
        let doc: any = generateDocumentForModel(
          name,
          i,
          schemaPaths,
          createdIds,
        );

        // ensure referenced docs exist: if we assigned an ObjectId for a ref but the referenced
        // collection has no created ids tracked, insert a minimal doc so the _id is present in DB.
        for (const p of Object.keys(schemaPaths)) {
          const pathType = schemaPaths[p];
          const ref = pathType && pathType.options && pathType.options.ref;
          if (!ref) continue;
          const val = doc[p];
          const isObjectId =
            val &&
            (val._bsontype === 'ObjectID' || mongoose.isValidObjectId(val));
          if (isObjectId) {
            createdIds[ref] = createdIds[ref] || [];
            if (!createdIds[ref].length) {
              try {
                const refModel = models[ref];
                if (refModel) {
                  // insert a minimal document with this _id
                  await refModel.collection.insertOne({ _id: val });
                  createdIds[ref].push(val);
                }
              } catch (err) {
                // ignore insertion failure for ref
              }
            }
          }
        }

        // ensure common naming fields are human-friendly across all models
        const nameFields = ['name', 'title', 'label', 'fullName'];
        for (const nf of nameFields) {
          if (
            nf in schemaPaths &&
            (doc[nf] == null ||
              (typeof doc[nf] === 'string' &&
                doc[nf].includes(`${name} `) === false))
          ) {
            doc[nf] = `${name} ${i}`;
          }
        }

        // common plural-to-array handling (e.g., insurances)
        for (const p of Object.keys(schemaPaths)) {
          if (
            p.toLowerCase().endsWith('s') &&
            Array.isArray(doc[p]) === false
          ) {
            // if schema indicates array or plural field name, coerce to array
            const pathType = schemaPaths[p];
            if (
              (pathType.instance && pathType.instance === 'Array') ||
              /s$/.test(p)
            ) {
              doc[p] = Array.isArray(doc[p]) ? doc[p] : [doc[p]];
            }
          }
        }

        // allow enum hints to overwrite generated values for known enum-backed fields
        doc = applyEnumHints(name, doc, schemaPaths, i);

        // ensure unique fields have concrete unique values
        for (const uf of Array.from(uniqueFields)) {
          if (doc[uf] == null) {
            if (uf.toLowerCase().includes('email'))
              doc[uf] = `${name.toLowerCase()}.${i}@example.com`;
            else
              doc[uf] =
                `${name}-${uf}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
          } else {
            if (typeof doc[uf] === 'string')
              doc[uf] =
                `${doc[uf]}-${i}-${Math.random().toString(36).slice(2, 4)}`;
          }
        }

        // insert using collection to bypass strict validation for missing required fields
        let insertedId: any = null;
        let attempts = 0;
        while (attempts < 3) {
          attempts++;
          try {
            const insertRes = await model.collection.insertOne(doc as any);
            insertedId = insertRes.insertedId;
            break;
          } catch (err: any) {
            if (err && err.code === 11000) {
              for (const uf of Array.from(uniqueFields)) {
                if (typeof doc[uf] === 'string')
                  doc[uf] =
                    `${doc[uf]}-r${attempts}-${Math.random().toString(36).slice(2, 4)}`;
                else
                  doc[uf] =
                    `${name}-${uf}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
              }
              continue;
            }
            console.warn('Insert failed for model', name, err.message || err);
            break;
          }
        }

        if (insertedId) createdIds[name].push(insertedId);
      }
      console.log(`Seeded ${createdIds[name].length} docs for ${name}`);
    } catch (err) {
      console.warn('Failed to seed model', name, err.message);
    }
  }

  console.log('Seeding complete. Summary:');
  for (const k of Object.keys(createdIds)) console.log(k, createdIds[k].length);

  await mongoose.disconnect();
  console.log('Disconnected.');
}

run().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
