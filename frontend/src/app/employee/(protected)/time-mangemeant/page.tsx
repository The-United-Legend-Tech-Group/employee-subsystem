import TimeManagementClient from "./components/TimeManagementClient";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import PunchClockRoundedIcon from "@mui/icons-material/PunchClockRounded";
import WorkHistoryRoundedIcon from "@mui/icons-material/WorkHistoryRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";

const SECTIONS = [
  {
    id: "overview",
    title: "Time ops overview",
    description:
      "High-level metrics summarising shifts, corrections, and payroll readiness.",
    icon: <DashboardRoundedIcon fontSize="small" />,
    allowedRoles: [
      "department employee",
      "department head",
      "HR Employee",
      "HR Manager",
      "Payroll Specialist",
      "System Admin",
    ],
  },
  {
    id: "attendance",
    title: "Attendance & corrections",
    description:
      "Monitor employee punches, corrections, and manager approvals in real time.",
    icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
    allowedRoles: [
      "department employee",
      "department head",
      "HR Employee",
      "HR Admin",
    ],
  },
  {
    id: "shifts",
    title: "Shift assignments",
    description:
      "View active shift templates and forthcoming employee coverage blocks.",
    icon: <WorkHistoryRoundedIcon fontSize="small" />,
    allowedRoles: ["System Admin", "HR Employee", "HR Manager"],
  },
  {
    id: "policies",
    title: "Policies & rules",
    description:
      "Surface punch policies, overtime approvals, and scheduling patterns in one place.",
    icon: <RuleRoundedIcon fontSize="small" />,
    allowedRoles: ["HR Manager", "HR Admin", "System Admin"],
  },
  {
    id: "exceptions",
    title: "Exceptions & holidays",
    description: "Track holidays, time exceptions",
    icon: <EventBusyRoundedIcon fontSize="small" />,
    allowedRoles: ["department head", "HR Admin", "Payroll Specialist"],
  },
  {
    id: "attendance-records",
    title: "Attendance records & punches",
    description:
      "View and record employee clock in/out punches and daily attendance tracking.",
    icon: <PunchClockRoundedIcon fontSize="small" />,
    allowedRoles: [
      "department employee",
      "department head",
      "HR Employee",
      "HR Manager",
      "Payroll Specialist",
    ],
  },
  {
    id: "time-exceptions",
    title: "Time exceptions",
    description:
      "Monitor and resolve attendance exceptions including missed punches, late arrivals, and overtime requests.",
    icon: <ReportProblemRoundedIcon fontSize="small" />,
    allowedRoles: ["department employee", "department head", "HR Admin"],
  },
];

export default function TimeManagementPage() {
  return <TimeManagementClient sections={SECTIONS} />;
}
