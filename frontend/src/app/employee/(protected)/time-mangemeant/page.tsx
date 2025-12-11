import TimeManagementClient from "./components/TimeManagementClient";

const SECTIONS = [
  {
    id: "overview",
    title: "Time ops overview",
    description:
      "High-level metrics summarising shifts, corrections, and payroll readiness.",
  },
  {
    id: "attendance",
    title: "Attendance & corrections",
    description:
      "Monitor employee punches, corrections, and manager approvals in real time.",
  },
  {
    id: "shifts",
    title: "Shift assignments",
    description:
      "View active shift templates and forthcoming employee coverage blocks.",
  },
  {
    id: "policies",
    title: "Policies & rules",
    description:
      "Surface punch policies, overtime approvals, and scheduling patterns in one place.",
  },
  {
    id: "exceptions",
    title: "Exceptions & payroll",
    description:
      "Track holidays, time exceptions, and approved corrections ready for payroll.",
  },
];

export default function TimeManagementPage() {
  return <TimeManagementClient sections={SECTIONS} />;
}
