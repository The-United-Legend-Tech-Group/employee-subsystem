"use client";
import { useState, useEffect } from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Collapse from "@mui/material/Collapse";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import SendTwoToneIcon from '@mui/icons-material/SendTwoTone';
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import { usePathname, useRouter } from "next/navigation";
import { getUserRoles } from "../../../utils/cookie-utils";

// Type definition for menu items
export interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path?: string;
  roles?: string[];
}

export const mainListItems: MenuItem[] = [
  { text: "Home", icon: <HomeRoundedIcon />, path: "/employee/dashboard", roles: [] },
  {
    text: "Calendar",
    icon: <CalendarMonthRoundedIcon />,
    path: "/employee/calendar",
  },
  { text: "Team", icon: <PeopleRoundedIcon />, path: "/employee/team", roles: ["department head"] },
  {
    text: "Time Management",
    icon: <AccessTimeRoundedIcon />,
    path: "/employee/time-mangemeant",
  },
  {
    text: "Manage Organization",
    icon: <ApartmentRoundedIcon />,
    path: "/employee/manage-organization"
  },
  { text: 'Employee Requests', icon: <EditNoteRoundedIcon />, path: '/employee/manage-requests' },
  { text: 'Manage Employees', icon: <PeopleRoundedIcon />, path: '/employee/manage-employees' },
  { text: 'Compose Notification', icon: <SendTwoToneIcon />, path: '/employee/compose-notification' },
  { text: 'Organization Changes', icon: <AssignmentRoundedIcon />, path: '/employee/manage-structure-requests' },

];

export const performanceSubItems: MenuItem[] = [
  {
    text: "Dashboard",
    icon: <DashboardRoundedIcon />,
    path: "/employee/performance/dashboard",
  },
  {
    text: "Performance Templates",
    icon: <AssessmentRoundedIcon />,
    path: "/employee/performance/templates",
  },
  {
    text: "Appraisal Cycles",
    icon: <AccessTimeRoundedIcon />,
    path: "/employee/performance/cycles",
  },
  {
    text: "Appraisal Assignments",
    icon: <AssignmentRoundedIcon />,
    path: "/employee/performance/assignments",
  },
  {
    text: "Appraisal Monitoring",
    icon: <VisibilityRoundedIcon />,
    path: "/employee/performance/monitoring",
  },
  {
    text: "Manager Appraisal",
    icon: <AssignmentRoundedIcon />,
    path: "/employee/performance/manager",
  },
  {
    text: "My Assigned Appraisals",
    icon: <AssignmentRoundedIcon />,
    path: "/employee/performance/manager-assignments",
  },
  {
    text: "My Performance",
    icon: <AssessmentRoundedIcon />,
    path: "/employee/performance/my-records",
  },
  {
    text: "Manage Disputes",
    icon: <GavelRoundedIcon />,
    path: "/employee/performance/manage-disputes",
  },
  {
    text: "Disputes",
    icon: <ReportProblemRoundedIcon />,
    path: "/employee/performance/disputes",
  },
];

export const recruitmentSubItems: MenuItem[] = [
  { text: 'Overview', icon: <AssignmentRoundedIcon />, path: '/employee/recruitment_sub' },
  { text: 'Employee', icon: <PeopleRoundedIcon />, path: '/employee/recruitment_sub/employee' },
  { text: 'HR Employee', icon: <PeopleRoundedIcon />, path: '/employee/recruitment_sub/hr-employee' },
  { text: 'HR Manager', icon: <PeopleRoundedIcon />, path: '/employee/recruitment_sub/hr-manager' },
  { text: 'System Admin', icon: <PeopleRoundedIcon />, path: '/employee/recruitment_sub/system-admin' },
];

const secondaryListItems = [
  { text: "Settings", icon: <SettingsRoundedIcon /> },
  { text: "About", icon: <InfoRoundedIcon /> },
  { text: "Feedback", icon: <HelpRoundedIcon /> },
];

export default function MenuContent() {
  const pathname = usePathname();
  const router = useRouter();
  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [recruitmentOpen, setRecruitmentOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Load user roles only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    setUserRoles(getUserRoles());
  }, []);

  const isCandidate = pathname.startsWith("/candidate");
  const isPerformancePath = pathname.startsWith("/employee/performance");
  const isRecruitmentPath = pathname.startsWith('/employee/recruitment_sub');

  const visibleListItems = mainListItems.filter((item) => {
    if (isCandidate && item.text === "Team") return false;
    // Only apply role-based filtering on client side after hydration
    if (isClient) {
      // @ts-ignore
      if (item.roles && item.roles.length > 0 && !item.roles.some((role) => userRoles.includes(role))) {
        return false;
      }
    }
    return true;
  });

  const isSelected = (text: string) => {
    if (text === 'Home' && (pathname === '/employee/dashboard' || pathname === '/candidate/dashboard')) return true;
    if (text === 'Team' && pathname === '/employee/team') return true;
    if (text === 'Analytics' && pathname === '/employee/analytics') return true;
    if (text === 'Settings' && pathname === '/employee/settings') return true;
    if (text === 'Calendar' && pathname === '/employee/calendar') return true;
    if (text === 'Manage Organization' && pathname === '/employee/manage-organization') return true;
    if (text === 'Employee Requests') return pathname === '/employee/manage-requests';
    if (text === 'Manage Employees') return pathname.startsWith('/employee/manage-employees');
    if (text === 'Compose Notification') return pathname === '/employee/compose-notification';
    if (text === 'Organization Changes') return pathname === '/employee/manage-structure-requests';
    if (text === 'Time Management') return pathname === '/employee/time-mangemeant';
    if (text === 'Dashboard' && pathname === '/employee/performance/dashboard') return true;
    if (text === 'Performance Templates' && pathname === '/employee/performance/templates') return true;
    if (text === 'Appraisal Cycles' && pathname === '/employee/performance/cycles') return true;
    if (text === 'Appraisal Assignments' && pathname === '/employee/performance/assignments') return true;
    if (text === 'Appraisal Monitoring' && pathname === '/employee/performance/monitoring') return true;
    if (text === 'Manager Appraisal' && pathname === '/employee/performance/manager') return true;
    if (text === 'My Assigned Appraisals' && pathname === '/employee/performance/manager-assignments') return true;
    if (text === 'My Performance' && pathname === '/employee/performance/my-records') return true;
    if (text === 'Manage Disputes' && pathname === '/employee/performance/manage-disputes') return true;
    if (text === 'Disputes' && pathname === '/employee/performance/disputes') return true;
    if (text === 'Recruitment' && pathname.startsWith('/employee/recruitment_sub')) return true;
    return false;
  };

  const handleNavigation = (text: string, path?: string) => {
    if (path) {
      router.push(path);
      return;
    }

    if (text === "Home") {
      if (isCandidate) {
        router.push("/candidate/dashboard");
      } else {
        router.push("/employee/dashboard");
      }
    }
    if (text === 'Team') router.push('/employee/team');
    if (text === 'Analytics') router.push('/employee/analytics');
    if (text === 'Settings') router.push('/employee/settings');
    if (text === 'Calendar') router.push('/employee/calendar');
    if (text === 'Organization Changes') router.push('/employee/manage-structure-requests');
    if (text === 'Manage Organization') router.push('/employee/manage-organization'); // Assuming this was already there or handled generally
    if (text === 'Employee Requests') router.push('/employee/manage-requests');
    if (text === 'Manage Employees') router.push('/employee/manage-employees');
    if (text === 'Compose Notification') router.push('/employee/compose-notification');
    if (text === 'Time Management') router.push('/employee/time-mangemeant');
  };

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: "space-between" }}>
      <List dense>
        {visibleListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton
              selected={isSelected(item.text)}
              onClick={() => handleNavigation(item.text, item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}

        {/* Performance Dropdown */}
        <ListItem disablePadding sx={{ display: "block" }}>
          <ListItemButton
            selected={isPerformancePath}
            onClick={() => setPerformanceOpen(!performanceOpen)}
          >
            <ListItemIcon>
              <TrendingUpRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="Performance" />
            {performanceOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
        </ListItem>

        <Collapse in={performanceOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {performanceSubItems.map((item, index) => {
              // Only apply role-based filtering on client side after hydration
              if (isClient) {
                // @ts-ignore
                if (item.roles && item.roles.length > 0 && !item.roles.some((role) => userRoles.includes(role))) {
                  return null;
                }
              }
              return (
                <ListItem key={index} disablePadding sx={{ display: "block" }}>
                  <ListItemButton
                    selected={isSelected(item.text)}
                    onClick={() => handleNavigation(item.text, item.path)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>

        {/* Recruitment Dropdown */}
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            selected={isRecruitmentPath}
            onClick={() => setRecruitmentOpen(!recruitmentOpen)}
          >
            <ListItemIcon>
              <WorkRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="Recruitment" />
            {recruitmentOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
        </ListItem>

        <Collapse in={recruitmentOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {recruitmentSubItems.map((item, index) => (
              <ListItem key={index} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  selected={isSelected(item.text)}
                  onClick={() => handleNavigation(item.text, item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>

      <List dense>
        {secondaryListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton
              selected={isSelected(item.text)}
              onClick={() => handleNavigation(item.text)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
