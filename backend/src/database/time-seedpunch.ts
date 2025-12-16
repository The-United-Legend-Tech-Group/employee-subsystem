import { config } from 'dotenv';
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

// Load environment variables
config({ path: process.cwd() + '/.env' });

const EMPLOYEE_ID = '6929b38042db6408754efdde'; // Target employee profile ID
const MANAGER_ID = '507f1f77bcf86cd799439011'; // Mock manager ID for exception handling

// Define schemas
const shiftTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  active: { type: Boolean, default: true },
});

const shiftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shiftType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShiftType',
    required: true,
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  punchPolicy: {
    type: String,
    enum: Object.values(PunchPolicy),
    default: PunchPolicy.FIRST_LAST,
  },
  graceInMinutes: { type: Number, default: 0 },
  graceOutMinutes: { type: Number, default: 0 },
  requiresApprovalForOvertime: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
});

const scheduleRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pattern: { type: String, required: true },
  active: { type: Boolean, default: true },
});

const holidaySchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(HolidayType), required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    name: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const shiftAssignmentSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeProfile' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position' },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true,
  },
  scheduleRuleId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScheduleRule' },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: {
    type: String,
    enum: Object.values(ShiftAssignmentStatus),
    default: ShiftAssignmentStatus.PENDING,
  },
});

const punchSubSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(PunchType), required: true },
    time: { type: Date, required: true },
  },
  { _id: false },
);

const attendanceRecordSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeeProfile',
    required: true,
  },
  date: { type: Date, required: true },
  punches: { type: [punchSubSchema], default: [] },
  totalWorkMinutes: { type: Number, default: 0 },
  hasMissedPunch: { type: Boolean, default: false },
  exceptionIds: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'TimeException', default: [] },
  ],
  finalisedForPayroll: { type: Boolean, default: true },
});

const timeExceptionSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeeProfile',
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(TimeExceptionType),
    required: true,
  },
  attendanceRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceRecord',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeeProfile',
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(TimeExceptionStatus),
    default: TimeExceptionStatus.OPEN,
  },
  reason: { type: String },
});

const attendanceCorrectionRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeeProfile',
    required: true,
  },
  attendanceRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceRecord',
    required: true,
  },
  reason: { type: String },
  status: {
    type: String,
    enum: Object.values(CorrectionRequestStatus),
    default: CorrectionRequestStatus.SUBMITTED,
  },
});

async function connect() {
  const isTest = process.env.NODE_ENV === 'test';
  const uri = isTest
    ? 'mongodb://localhost:27017/payroll-test'
    : process.env.MONGO_URI || 'mongodb://localhost:27017/payroll-subsystems';

  console.log(`Connecting to MongoDB...`);
  return mongoose.connect(uri);
}

async function seedTimeManagement() {
  await connect();
  console.log(
    'Connected to MongoDB. Starting time-management seed for employee:',
    EMPLOYEE_ID,
  );

  // Models
  const ShiftType = mongoose.model('ShiftType', shiftTypeSchema, 'shifttypes');
  const Shift = mongoose.model('Shift', shiftSchema, 'shifts');
  const ScheduleRule = mongoose.model(
    'ScheduleRule',
    scheduleRuleSchema,
    'schedulerules',
  );
  const Holiday = mongoose.model('Holiday', holidaySchema, 'holidays');
  const ShiftAssignment = mongoose.model(
    'ShiftAssignment',
    shiftAssignmentSchema,
    'shiftassignments',
  );
  const AttendanceRecord = mongoose.model(
    'AttendanceRecord',
    attendanceRecordSchema,
    'attendancerecords',
  );
  const TimeException = mongoose.model(
    'TimeException',
    timeExceptionSchema,
    'timeexceptions',
  );
  const AttendanceCorrectionRequest = mongoose.model(
    'AttendanceCorrectionRequest',
    attendanceCorrectionRequestSchema,
    'attendancecorrectionrequests',
  );

  try {
    // 1. Create Shift Types
    console.log('\n1. Creating Shift Types...');
    const shiftTypes = await ShiftType.insertMany([
      { name: 'Regular Day Shift', active: true },
      { name: 'Night Operations', active: true },
      { name: 'Morning Shift', active: true },
      { name: 'Evening Shift', active: true },
      { name: 'Flexible Hours', active: true },
      { name: 'Weekend Coverage', active: false },
    ]);
    console.log(`Created ${shiftTypes.length} shift types`);

    // 2. Create Shifts
    console.log('\n2. Creating Shifts...');
    const shifts = await Shift.insertMany([
      {
        name: 'Standard Office Hours (9AM-5PM)',
        shiftType: shiftTypes[0]._id,
        startTime: '09:00',
        endTime: '17:00',
        punchPolicy: PunchPolicy.FIRST_LAST,
        graceInMinutes: 15,
        graceOutMinutes: 10,
        requiresApprovalForOvertime: true,
        active: true,
      },
      {
        name: 'Night Operations (10PM-6AM)',
        shiftType: shiftTypes[1]._id,
        startTime: '22:00',
        endTime: '06:00',
        punchPolicy: PunchPolicy.FIRST_LAST,
        graceInMinutes: 20,
        graceOutMinutes: 20,
        requiresApprovalForOvertime: false,
        active: true,
      },
      {
        name: 'Early Morning Shift (6AM-2PM)',
        shiftType: shiftTypes[2]._id,
        startTime: '06:00',
        endTime: '14:00',
        punchPolicy: PunchPolicy.FIRST_LAST,
        graceInMinutes: 10,
        graceOutMinutes: 10,
        requiresApprovalForOvertime: true,
        active: true,
      },
      {
        name: 'Afternoon Coverage (2PM-10PM)',
        shiftType: shiftTypes[3]._id,
        startTime: '14:00',
        endTime: '22:00',
        punchPolicy: PunchPolicy.FIRST_LAST,
        graceInMinutes: 15,
        graceOutMinutes: 15,
        requiresApprovalForOvertime: false,
        active: true,
      },
      {
        name: 'Flexible Work Schedule',
        shiftType: shiftTypes[4]._id,
        startTime: '08:00',
        endTime: '16:00',
        punchPolicy: PunchPolicy.MULTIPLE,
        graceInMinutes: 30,
        graceOutMinutes: 30,
        requiresApprovalForOvertime: true,
        active: true,
      },
    ]);
    console.log(`Created ${shifts.length} shifts`);

    // 3. Create Schedule Rules
    console.log('\n3. Creating Schedule Rules...');
    const scheduleRules = await ScheduleRule.insertMany([
      {
        name: 'Monday to Friday Weekday Schedule',
        pattern: '5-2',
        active: true,
      },
      {
        name: 'Rotating Shift Pattern',
        pattern: 'rotating-3-week',
        active: true,
      },
      { name: '4-Day Work Week', pattern: '4-3', active: true },
      {
        name: 'Weekend Duty Roster',
        pattern: 'weekend-rotation',
        active: false,
      },
    ]);
    console.log(`Created ${scheduleRules.length} schedule rules`);

    // 4. Create Holidays
    console.log('\n4. Creating Holidays...');
    const currentYear = new Date().getFullYear();
    const holidays = await Holiday.insertMany([
      {
        type: HolidayType.NATIONAL,
        startDate: new Date(`${currentYear}-01-01`),
        name: "New Year's Day",
        active: true,
      },
      {
        type: HolidayType.NATIONAL,
        startDate: new Date(`${currentYear}-07-04`),
        name: 'Independence Day',
        active: true,
      },
      {
        type: HolidayType.NATIONAL,
        startDate: new Date(`${currentYear}-12-25`),
        name: 'Christmas Day',
        active: true,
      },
      {
        type: HolidayType.ORGANIZATIONAL,
        startDate: new Date(`${currentYear}-03-15`),
        name: 'Company Foundation Day',
        active: true,
      },
      {
        type: HolidayType.ORGANIZATIONAL,
        startDate: new Date(`${currentYear}-08-15`),
        endDate: new Date(`${currentYear}-08-17`),
        name: 'Summer Company Retreat',
        active: true,
      },
      {
        type: HolidayType.WEEKLY_REST,
        startDate: new Date(`${currentYear}-01-01`),
        endDate: new Date(`${currentYear}-12-31`),
        name: 'Weekly Rest Day - Friday',
        active: true,
      },
    ]);
    console.log(`Created ${holidays.length} holidays`);

    // 5. Create Shift Assignments for Employee
    console.log('\n5. Creating Shift Assignments...');
    const employeeObjectId = new mongoose.Types.ObjectId(EMPLOYEE_ID);
    const now = new Date();
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate(),
    );
    const twoMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 2,
      now.getDate(),
    );
    const oneMonthFromNow = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
    );

    const shiftAssignments = await ShiftAssignment.insertMany([
      {
        employeeId: employeeObjectId,
        shiftId: shifts[0]._id,
        scheduleRuleId: scheduleRules[0]._id,
        startDate: twoMonthsAgo,
        endDate: oneMonthAgo,
        status: ShiftAssignmentStatus.APPROVED,
      },
      {
        employeeId: employeeObjectId,
        shiftId: shifts[0]._id,
        scheduleRuleId: scheduleRules[0]._id,
        startDate: oneMonthAgo,
        endDate: null, // Ongoing
        status: ShiftAssignmentStatus.APPROVED,
      },
      {
        employeeId: employeeObjectId,
        shiftId: shifts[2]._id,
        scheduleRuleId: scheduleRules[0]._id,
        startDate: oneMonthFromNow,
        endDate: null,
        status: ShiftAssignmentStatus.PENDING,
      },
      {
        employeeId: employeeObjectId,
        shiftId: shifts[1]._id,
        scheduleRuleId: scheduleRules[1]._id,
        startDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() - 2, 28),
        status: ShiftAssignmentStatus.EXPIRED,
      },
    ]);
    console.log(`Created ${shiftAssignments.length} shift assignments`);

    // 6. Create Attendance Records with Various Scenarios
    console.log('\n6. Creating Attendance Records...');
    const attendanceRecords: Array<{
      employeeId: mongoose.Types.ObjectId;
      date: Date;
      punches: Array<{ type: PunchType; time: Date }>;
      totalWorkMinutes: number;
      hasMissedPunch: boolean;
      finalisedForPayroll: boolean;
    }> = [];

    // Scenario 1: Perfect attendance - Complete punch in/out
    const perfectDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 5,
    );
    perfectDay.setHours(9, 2, 0, 0);
    const perfectDayOut = new Date(perfectDay);
    perfectDayOut.setHours(17, 5, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        perfectDay.getFullYear(),
        perfectDay.getMonth(),
        perfectDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: perfectDay },
        { type: PunchType.OUT, time: perfectDayOut },
      ],
      totalWorkMinutes: 483,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 2: Late arrival
    const lateDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 4,
    );
    lateDay.setHours(9, 35, 0, 0);
    const lateDayOut = new Date(lateDay);
    lateDayOut.setHours(17, 10, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        lateDay.getFullYear(),
        lateDay.getMonth(),
        lateDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: lateDay },
        { type: PunchType.OUT, time: lateDayOut },
      ],
      totalWorkMinutes: 455,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 3: Early departure
    const earlyLeaveDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 3,
    );
    earlyLeaveDay.setHours(9, 0, 0, 0);
    const earlyLeaveDayOut = new Date(earlyLeaveDay);
    earlyLeaveDayOut.setHours(15, 30, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        earlyLeaveDay.getFullYear(),
        earlyLeaveDay.getMonth(),
        earlyLeaveDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: earlyLeaveDay },
        { type: PunchType.OUT, time: earlyLeaveDayOut },
      ],
      totalWorkMinutes: 390,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 4: Missed punch-out
    const missedPunchDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 2,
    );
    missedPunchDay.setHours(9, 5, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        missedPunchDay.getFullYear(),
        missedPunchDay.getMonth(),
        missedPunchDay.getDate(),
      ),
      punches: [{ type: PunchType.IN, time: missedPunchDay }],
      totalWorkMinutes: 0,
      hasMissedPunch: true,
      finalisedForPayroll: false,
    });

    // Scenario 5: Multiple punches (flexible shift)
    const flexDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
    );
    const flexIn1 = new Date(flexDay);
    flexIn1.setHours(8, 30, 0, 0);
    const flexOut1 = new Date(flexDay);
    flexOut1.setHours(12, 0, 0, 0);
    const flexIn2 = new Date(flexDay);
    flexIn2.setHours(13, 30, 0, 0);
    const flexOut2 = new Date(flexDay);
    flexOut2.setHours(18, 0, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        flexDay.getFullYear(),
        flexDay.getMonth(),
        flexDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: flexIn1 },
        { type: PunchType.OUT, time: flexOut1 },
        { type: PunchType.IN, time: flexIn2 },
        { type: PunchType.OUT, time: flexOut2 },
      ],
      totalWorkMinutes: 480,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 6: Overtime work
    const overtimeDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6,
    );
    overtimeDay.setHours(9, 0, 0, 0);
    const overtimeDayOut = new Date(overtimeDay);
    overtimeDayOut.setHours(20, 30, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        overtimeDay.getFullYear(),
        overtimeDay.getMonth(),
        overtimeDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: overtimeDay },
        { type: PunchType.OUT, time: overtimeDayOut },
      ],
      totalWorkMinutes: 690,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 7: No punches (absent)
    const absentDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7,
    );
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        absentDay.getFullYear(),
        absentDay.getMonth(),
        absentDay.getDate(),
      ),
      punches: [],
      totalWorkMinutes: 0,
      hasMissedPunch: true,
      finalisedForPayroll: true,
    });

    // Scenario 8: Short work hours
    const shortDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 8,
    );
    shortDay.setHours(10, 0, 0, 0);
    const shortDayOut = new Date(shortDay);
    shortDayOut.setHours(14, 30, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        shortDay.getFullYear(),
        shortDay.getMonth(),
        shortDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: shortDay },
        { type: PunchType.OUT, time: shortDayOut },
      ],
      totalWorkMinutes: 270,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 9: Very early arrival and late departure
    const longDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 9,
    );
    longDay.setHours(7, 15, 0, 0);
    const longDayOut = new Date(longDay);
    longDayOut.setHours(19, 45, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        longDay.getFullYear(),
        longDay.getMonth(),
        longDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: longDay },
        { type: PunchType.OUT, time: longDayOut },
      ],
      totalWorkMinutes: 750,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 10: Split shift with long break
    const splitShiftDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 15,
    );
    const splitIn1 = new Date(splitShiftDay);
    splitIn1.setHours(9, 0, 0, 0);
    const splitOut1 = new Date(splitShiftDay);
    splitOut1.setHours(13, 0, 0, 0);
    const splitIn2 = new Date(splitShiftDay);
    splitIn2.setHours(17, 0, 0, 0);
    const splitOut2 = new Date(splitShiftDay);
    splitOut2.setHours(21, 0, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        splitShiftDay.getFullYear(),
        splitShiftDay.getMonth(),
        splitShiftDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: splitIn1 },
        { type: PunchType.OUT, time: splitOut1 },
        { type: PunchType.IN, time: splitIn2 },
        { type: PunchType.OUT, time: splitOut2 },
      ],
      totalWorkMinutes: 480,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 11: Three short work sessions
    const threeSessionDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 16,
    );
    const session1In = new Date(threeSessionDay);
    session1In.setHours(8, 0, 0, 0);
    const session1Out = new Date(threeSessionDay);
    session1Out.setHours(10, 30, 0, 0);
    const session2In = new Date(threeSessionDay);
    session2In.setHours(11, 0, 0, 0);
    const session2Out = new Date(threeSessionDay);
    session2Out.setHours(13, 30, 0, 0);
    const session3In = new Date(threeSessionDay);
    session3In.setHours(14, 30, 0, 0);
    const session3Out = new Date(threeSessionDay);
    session3Out.setHours(17, 0, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        threeSessionDay.getFullYear(),
        threeSessionDay.getMonth(),
        threeSessionDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: session1In },
        { type: PunchType.OUT, time: session1Out },
        { type: PunchType.IN, time: session2In },
        { type: PunchType.OUT, time: session2Out },
        { type: PunchType.IN, time: session3In },
        { type: PunchType.OUT, time: session3Out },
      ],
      totalWorkMinutes: 450,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 12: Night shift worker
    const nightShiftDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 17,
    );
    nightShiftDay.setHours(22, 5, 0, 0);
    const nightShiftOut = new Date(nightShiftDay);
    nightShiftOut.setDate(nightShiftOut.getDate() + 1);
    nightShiftOut.setHours(6, 10, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        nightShiftDay.getFullYear(),
        nightShiftDay.getMonth(),
        nightShiftDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: nightShiftDay },
        { type: PunchType.OUT, time: nightShiftOut },
      ],
      totalWorkMinutes: 485,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 13: Half day - morning only
    const halfDayMorning = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 18,
    );
    halfDayMorning.setHours(9, 0, 0, 0);
    const halfDayMorningOut = new Date(halfDayMorning);
    halfDayMorningOut.setHours(13, 0, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        halfDayMorning.getFullYear(),
        halfDayMorning.getMonth(),
        halfDayMorning.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: halfDayMorning },
        { type: PunchType.OUT, time: halfDayMorningOut },
      ],
      totalWorkMinutes: 240,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 14: Half day - afternoon only
    const halfDayAfternoon = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 19,
    );
    halfDayAfternoon.setHours(13, 0, 0, 0);
    const halfDayAfternoonOut = new Date(halfDayAfternoon);
    halfDayAfternoonOut.setHours(17, 0, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        halfDayAfternoon.getFullYear(),
        halfDayAfternoon.getMonth(),
        halfDayAfternoon.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: halfDayAfternoon },
        { type: PunchType.OUT, time: halfDayAfternoonOut },
      ],
      totalWorkMinutes: 240,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 15: Extremely late arrival
    const veryLateDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 20,
    );
    veryLateDay.setHours(11, 45, 0, 0);
    const veryLateDayOut = new Date(veryLateDay);
    veryLateDayOut.setHours(17, 30, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        veryLateDay.getFullYear(),
        veryLateDay.getMonth(),
        veryLateDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: veryLateDay },
        { type: PunchType.OUT, time: veryLateDayOut },
      ],
      totalWorkMinutes: 345,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 16: Multiple punch attempts (system glitch)
    const glitchDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 21,
    );
    const glitchIn1 = new Date(glitchDay);
    glitchIn1.setHours(8, 58, 0, 0);
    const glitchIn2 = new Date(glitchDay);
    glitchIn2.setHours(8, 59, 0, 0);
    const glitchIn3 = new Date(glitchDay);
    glitchIn3.setHours(9, 0, 0, 0);
    const glitchOut1 = new Date(glitchDay);
    glitchOut1.setHours(17, 0, 0, 0);
    const glitchOut2 = new Date(glitchDay);
    glitchOut2.setHours(17, 1, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        glitchDay.getFullYear(),
        glitchDay.getMonth(),
        glitchDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: glitchIn1 },
        { type: PunchType.IN, time: glitchIn2 },
        { type: PunchType.IN, time: glitchIn3 },
        { type: PunchType.OUT, time: glitchOut1 },
        { type: PunchType.OUT, time: glitchOut2 },
      ],
      totalWorkMinutes: 483,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 17: Weekend emergency work
    const weekendWork = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 22,
    );
    weekendWork.setHours(10, 0, 0, 0);
    const weekendWorkOut = new Date(weekendWork);
    weekendWorkOut.setHours(15, 0, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        weekendWork.getFullYear(),
        weekendWork.getMonth(),
        weekendWork.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: weekendWork },
        { type: PunchType.OUT, time: weekendWorkOut },
      ],
      totalWorkMinutes: 300,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 18: Very short work session (emergency call)
    const emergencyCall = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 23,
    );
    emergencyCall.setHours(14, 0, 0, 0);
    const emergencyCallOut = new Date(emergencyCall);
    emergencyCallOut.setHours(15, 15, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        emergencyCall.getFullYear(),
        emergencyCall.getMonth(),
        emergencyCall.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: emergencyCall },
        { type: PunchType.OUT, time: emergencyCallOut },
      ],
      totalWorkMinutes: 75,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 19: Extended overtime (project deadline)
    const crunchTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 24,
    );
    crunchTime.setHours(8, 30, 0, 0);
    const crunchTimeOut = new Date(crunchTime);
    crunchTimeOut.setHours(23, 0, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        crunchTime.getFullYear(),
        crunchTime.getMonth(),
        crunchTime.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: crunchTime },
        { type: PunchType.OUT, time: crunchTimeOut },
      ],
      totalWorkMinutes: 870,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });

    // Scenario 20: Missing punch-in (only punch-out recorded)
    const missingInDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 25,
    );
    missingInDay.setHours(17, 15, 0, 0);
    attendanceRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        missingInDay.getFullYear(),
        missingInDay.getMonth(),
        missingInDay.getDate(),
      ),
      punches: [{ type: PunchType.OUT, time: missingInDay }],
      totalWorkMinutes: 0,
      hasMissedPunch: true,
      finalisedForPayroll: false,
    });

    const insertedAttendance =
      await AttendanceRecord.insertMany(attendanceRecords);
    console.log(
      `Created ${insertedAttendance.length} attendance records with various scenarios`,
    );

    // 7. Create Time Exceptions
    console.log('\n7. Creating Time Exceptions...');
    const managerObjectId = new mongoose.Types.ObjectId(MANAGER_ID);
    const timeExceptions = await TimeException.insertMany([
      {
        employeeId: employeeObjectId,
        type: TimeExceptionType.LATE,
        attendanceRecordId: insertedAttendance[1]._id, // Late arrival day
        assignedTo: managerObjectId,
        status: TimeExceptionStatus.RESOLVED,
        reason: 'Traffic delay due to road construction',
      },
      {
        employeeId: employeeObjectId,
        type: TimeExceptionType.EARLY_LEAVE,
        attendanceRecordId: insertedAttendance[2]._id, // Early departure day
        assignedTo: managerObjectId,
        status: TimeExceptionStatus.APPROVED,
        reason: 'Medical appointment - approved by supervisor',
      },
      {
        employeeId: employeeObjectId,
        type: TimeExceptionType.MISSED_PUNCH,
        attendanceRecordId: insertedAttendance[3]._id, // Missed punch-out day
        assignedTo: managerObjectId,
        status: TimeExceptionStatus.PENDING,
        reason: 'Forgot to punch out - working on correction request',
      },
      {
        employeeId: employeeObjectId,
        type: TimeExceptionType.OVERTIME_REQUEST,
        attendanceRecordId: insertedAttendance[5]._id, // Overtime day
        assignedTo: managerObjectId,
        status: TimeExceptionStatus.APPROVED,
        reason:
          'Project deadline - pre-approved overtime for system deployment',
      },
      {
        employeeId: employeeObjectId,
        type: TimeExceptionType.SHORT_TIME,
        attendanceRecordId: insertedAttendance[7]._id, // Short work hours day
        assignedTo: managerObjectId,
        status: TimeExceptionStatus.OPEN,
        reason: 'Employee left early - reason not provided yet',
      },
      {
        employeeId: employeeObjectId,
        type: TimeExceptionType.MISSED_PUNCH,
        attendanceRecordId: insertedAttendance[6]._id, // Absent day
        assignedTo: managerObjectId,
        status: TimeExceptionStatus.ESCALATED,
        reason: 'No show, no call - escalated to HR',
      },
    ]);
    console.log(`Created ${timeExceptions.length} time exceptions`);

    // Update attendance records with exception IDs
    await AttendanceRecord.updateOne(
      { _id: insertedAttendance[1]._id },
      { $push: { exceptionIds: timeExceptions[0]._id } },
    );
    await AttendanceRecord.updateOne(
      { _id: insertedAttendance[2]._id },
      { $push: { exceptionIds: timeExceptions[1]._id } },
    );
    await AttendanceRecord.updateOne(
      { _id: insertedAttendance[3]._id },
      { $push: { exceptionIds: timeExceptions[2]._id } },
    );
    await AttendanceRecord.updateOne(
      { _id: insertedAttendance[5]._id },
      { $push: { exceptionIds: timeExceptions[3]._id } },
    );
    await AttendanceRecord.updateOne(
      { _id: insertedAttendance[7]._id },
      { $push: { exceptionIds: timeExceptions[4]._id } },
    );
    await AttendanceRecord.updateOne(
      { _id: insertedAttendance[6]._id },
      { $push: { exceptionIds: timeExceptions[5]._id } },
    );

    // 8. Create Attendance Correction Requests
    console.log('\n8. Creating Attendance Correction Requests...');
    const correctionRequests = await AttendanceCorrectionRequest.insertMany([
      {
        employeeId: employeeObjectId,
        attendanceRecord: insertedAttendance[3]._id, // Missed punch-out day
        reason:
          'I forgot to punch out at 5:15 PM. I was in a meeting that ran late and left directly after.',
        status: CorrectionRequestStatus.SUBMITTED,
      },
      {
        employeeId: employeeObjectId,
        attendanceRecord: insertedAttendance[1]._id, // Late arrival
        reason:
          'Traffic accident on highway caused 30-minute delay. Can provide incident report if needed.',
        status: CorrectionRequestStatus.APPROVED,
      },
      {
        employeeId: employeeObjectId,
        attendanceRecord: insertedAttendance[7]._id, // Short work hours
        reason:
          'Request to mark half-day leave - had family emergency in the afternoon.',
        status: CorrectionRequestStatus.IN_REVIEW,
      },
      {
        employeeId: employeeObjectId,
        attendanceRecord: insertedAttendance[6]._id, // Absent day
        reason:
          'Was sick with flu - can provide medical certificate. Please mark as sick leave.',
        status: CorrectionRequestStatus.REJECTED,
      },
      {
        employeeId: employeeObjectId,
        attendanceRecord: insertedAttendance[2]._id, // Early departure day
        reason:
          'Left early at 3:30 PM for medical appointment. Doctor appointment was scheduled weeks in advance.',
        status: CorrectionRequestStatus.ESCALATED,
      },
    ]);
    console.log(
      `Created ${correctionRequests.length} attendance correction requests`,
    );

    // 9. Create Additional Attendance Records for Manual Correction Testing
    console.log(
      '\n9. Creating Additional Attendance Records for Manual Correction...',
    );
    const manualCorrectionRecords: Array<{
      employeeId: mongoose.Types.ObjectId;
      date: Date;
      punches: Array<{ type: PunchType; time: Date }>;
      totalWorkMinutes: number;
      hasMissedPunch: boolean;
      finalisedForPayroll: boolean;
    }> = [];

    // Record 1: Wrong punch times - needs manual correction
    const wrongTimeDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 10,
    );
    wrongTimeDay.setHours(9, 0, 0, 0);
    const wrongTimeOut = new Date(wrongTimeDay);
    wrongTimeOut.setHours(17, 0, 0, 0);
    manualCorrectionRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        wrongTimeDay.getFullYear(),
        wrongTimeDay.getMonth(),
        wrongTimeDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: wrongTimeDay },
        { type: PunchType.OUT, time: wrongTimeOut },
      ],
      totalWorkMinutes: 480,
      hasMissedPunch: false,
      finalisedForPayroll: false,
    });

    // Record 2: Duplicate punch entries - needs cleanup
    const duplicatePunchDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 11,
    );
    const dupIn1 = new Date(duplicatePunchDay);
    dupIn1.setHours(8, 55, 0, 0);
    const dupIn2 = new Date(duplicatePunchDay);
    dupIn2.setHours(8, 58, 0, 0);
    const dupOut = new Date(duplicatePunchDay);
    dupOut.setHours(17, 2, 0, 0);
    manualCorrectionRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        duplicatePunchDay.getFullYear(),
        duplicatePunchDay.getMonth(),
        duplicatePunchDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: dupIn1 },
        { type: PunchType.IN, time: dupIn2 }, // Duplicate IN punch
        { type: PunchType.OUT, time: dupOut },
      ],
      totalWorkMinutes: 487,
      hasMissedPunch: false,
      finalisedForPayroll: false,
    });

    // Record 3: Missing both punches - complete day needs to be added
    const missingBothDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 12,
    );
    manualCorrectionRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        missingBothDay.getFullYear(),
        missingBothDay.getMonth(),
        missingBothDay.getDate(),
      ),
      punches: [],
      totalWorkMinutes: 0,
      hasMissedPunch: true,
      finalisedForPayroll: false,
    });

    // Record 4: Wrong punch sequence (OUT before IN)
    const wrongSequenceDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 13,
    );
    const wrongOut = new Date(wrongSequenceDay);
    wrongOut.setHours(9, 0, 0, 0);
    const wrongIn = new Date(wrongSequenceDay);
    wrongIn.setHours(17, 0, 0, 0);
    manualCorrectionRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        wrongSequenceDay.getFullYear(),
        wrongSequenceDay.getMonth(),
        wrongSequenceDay.getDate(),
      ),
      punches: [
        { type: PunchType.OUT, time: wrongOut }, // Wrong sequence
        { type: PunchType.IN, time: wrongIn },
      ],
      totalWorkMinutes: 0,
      hasMissedPunch: true,
      finalisedForPayroll: false,
    });

    // Record 5: Only punch-in, very old - needs correction
    const oldMissingPunchDay = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      15,
    );
    oldMissingPunchDay.setHours(8, 45, 0, 0);
    manualCorrectionRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        oldMissingPunchDay.getFullYear(),
        oldMissingPunchDay.getMonth(),
        oldMissingPunchDay.getDate(),
      ),
      punches: [{ type: PunchType.IN, time: oldMissingPunchDay }],
      totalWorkMinutes: 0,
      hasMissedPunch: true,
      finalisedForPayroll: false,
    });

    // Record 6: Incorrect total work minutes calculation
    const wrongCalculationDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 14,
    );
    const calcIn = new Date(wrongCalculationDay);
    calcIn.setHours(9, 0, 0, 0);
    const calcOut = new Date(wrongCalculationDay);
    calcOut.setHours(18, 0, 0, 0);
    manualCorrectionRecords.push({
      employeeId: employeeObjectId,
      date: new Date(
        wrongCalculationDay.getFullYear(),
        wrongCalculationDay.getMonth(),
        wrongCalculationDay.getDate(),
      ),
      punches: [
        { type: PunchType.IN, time: calcIn },
        { type: PunchType.OUT, time: calcOut },
      ],
      totalWorkMinutes: 300, // Wrong calculation (should be 540)
      hasMissedPunch: false,
      finalisedForPayroll: false,
    });

    const insertedManualRecords = await AttendanceRecord.insertMany(
      manualCorrectionRecords,
    );
    console.log(
      `Created ${insertedManualRecords.length} attendance records needing manual correction`,
    );

    // 10. Create Correction Requests for Manual Records
    console.log('\n10. Creating Correction Requests for Manual Records...');
    const manualCorrectionRequests =
      await AttendanceCorrectionRequest.insertMany([
        {
          employeeId: employeeObjectId,
          attendanceRecord: insertedManualRecords[0]._id,
          reason:
            'Punched with wrong device - actual times were 8:30 AM to 5:30 PM. Please correct the punch times.',
          status: CorrectionRequestStatus.SUBMITTED,
        },
        {
          employeeId: employeeObjectId,
          attendanceRecord: insertedManualRecords[1]._id,
          reason:
            'Accidentally punched in twice - card reader error. Please keep the first punch at 8:55 AM.',
          status: CorrectionRequestStatus.IN_REVIEW,
        },
        {
          employeeId: employeeObjectId,
          attendanceRecord: insertedManualRecords[2]._id,
          reason:
            'Worked from home but forgot to log attendance. Worked full day 9 AM - 5 PM. Manager can verify.',
          status: CorrectionRequestStatus.SUBMITTED,
        },
        {
          employeeId: employeeObjectId,
          attendanceRecord: insertedManualRecords[3]._id,
          reason:
            'System error recorded punches in wrong order. I worked normal hours 9 AM - 5 PM.',
          status: CorrectionRequestStatus.ESCALATED,
        },
        {
          employeeId: employeeObjectId,
          attendanceRecord: insertedManualRecords[4]._id,
          reason:
            'Forgot to punch out last month on the 15th. Left around 5:00 PM. Need to close this record.',
          status: CorrectionRequestStatus.SUBMITTED,
        },
        {
          employeeId: employeeObjectId,
          attendanceRecord: insertedManualRecords[5]._id,
          reason:
            'Total work hours calculated incorrectly by system. Worked 9 hours (9 AM - 6 PM) not 5 hours.',
          status: CorrectionRequestStatus.IN_REVIEW,
        },
      ]);
    console.log(
      `Created ${manualCorrectionRequests.length} manual correction requests`,
    );

    console.log('\n✅ Time Management seed completed successfully!');
    console.log('\nSummary:');
    console.log(`- Shift Types: ${shiftTypes.length}`);
    console.log(`- Shifts: ${shifts.length}`);
    console.log(`- Schedule Rules: ${scheduleRules.length}`);
    console.log(`- Holidays: ${holidays.length}`);
    console.log(`- Shift Assignments: ${shiftAssignments.length}`);
    console.log(
      `- Attendance Records: ${insertedAttendance.length + insertedManualRecords.length}`,
    );
    console.log(`- Time Exceptions: ${timeExceptions.length}`);
    console.log(
      `- Correction Requests: ${correctionRequests.length + manualCorrectionRequests.length}`,
    );
    console.log(`\nManual Correction Records: ${insertedManualRecords.length}`);
    console.log(`  - Wrong punch times: 1`);
    console.log(`  - Duplicate punches: 1`);
    console.log(`  - Missing both punches: 1`);
    console.log(`  - Wrong punch sequence: 1`);
    console.log(`  - Old missing punch: 1`);
    console.log(`  - Wrong calculation: 1`);
  } catch (error) {
    console.error('❌ Error seeding time management data:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

// Run the seed
seedTimeManagement().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
