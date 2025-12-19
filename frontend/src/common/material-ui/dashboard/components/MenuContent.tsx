"use client";
import { useState } from "react";
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
import BeachAccessRoundedIcon from "@mui/icons-material/BeachAccessRounded";
import PlaylistAddCheckRoundedIcon from "@mui/icons-material/PlaylistAddCheckRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { CalendarViewDay, History } from "@mui/icons-material";
import BalanceRoundedIcon from "@mui/icons-material/BalanceRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";



// Type definition for menu items
export interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path?: string;
  roles?: string[];
}

export const mainListItems: MenuItem[] = [
  { text: "Home", icon: <HomeRoundedIcon />, roles: [] },
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
    path: "/employee/manage-organization",
    roles: ["System Admin"]
  },
  { text: 'Employee Requests', icon: <EditNoteRoundedIcon />, path: '/employee/manage-requests', roles: ["HR Admin"] },
  { text: 'Manage Employees', icon: <PeopleRoundedIcon />, path: '/employee/manage-employees', roles: ["HR Admin"] },
  { text: 'Compose Notification', icon: <SendTwoToneIcon />, path: '/employee/compose-notification', roles: ["System Admin", "HR Admin", "HR Manager", "department head"] },
  { text: 'Organization Changes', icon: <AssignmentRoundedIcon />, path: '/employee/manage-structure-requests', roles: ["System Admin"] },

];

export const performanceSubItems: MenuItem[] = [
  {
    text: "Dashboard",
    icon: <DashboardRoundedIcon />,
    path: "/employee/performance/dashboard",
    roles: ["HR Manager"]
  },
  {
    text: "Performance Templates",
    icon: <AssessmentRoundedIcon />,
    path: "/employee/performance/templates",
    roles: ["HR Manager"]
  },
  {
    text: "Appraisal Cycles",
    icon: <AccessTimeRoundedIcon />,
    path: "/employee/performance/cycles",
    roles: ["HR Manager"]
  },
  {
    text: "Appraisal Assignments",
    icon: <AssignmentRoundedIcon />,
    path: "/employee/performance/assignments",
    roles: ["HR Employee"]
  },
  {
    text: "Appraisal Monitoring",
    icon: <VisibilityRoundedIcon />,
    path: "/employee/performance/monitoring",
    roles: ["HR Employee"]
  },
  {
    text: "Manager Appraisal",
    icon: <AssignmentRoundedIcon />,
    path: "/employee/performance/manager",
    roles: ["department head"]
  },
  {
    text: "Appraisal Review Hub",
    icon: <AssignmentRoundedIcon />,
    path: "/employee/performance/manager-assignments",
    roles: ["HR Employee"]
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
    roles: ["HR Manager"]
  },
  {
    text: "Disputes",
    icon: <ReportProblemRoundedIcon />,
    path: "/employee/performance/disputes",
    roles: ["HR Employee", "department employee"]
  },
];

export const leavesSubItems: MenuItem[] = [
  {
    text: "Requests Dashboard",
    icon: <DashboardRoundedIcon />,
    path: "/employee/leaves/requests/hr",
    roles: ["HR Manager"],
  },
  {
    text: "Requests Dashboard",
    icon: <DashboardRoundedIcon />,
    path: "/employee/leaves/requests/manager",
    roles: ["department head"],
  },
  {
    text: "Automation",
    icon: <AutoAwesomeRoundedIcon   />,
    path: "/employee/leaves/automation",
    roles: ["HR Manager"],
  },
  {
    text: "Leave Types",
    icon: <BeachAccessRoundedIcon />,
    path: "/employee/leaves/type",
    roles: ["HR Admin"],
  },
  {
    text: "Leave Policies",
    icon: <ListAltRoundedIcon />,
    path: "/employee/leaves/policy",
    roles: ["HR Admin"],
  },
  {
    text: "Approval Flow",
    icon: <ListAltRoundedIcon />,
    path: "/employee/leaves/requests/admin",
    roles: ["HR Admin"],
  },
  {
    text: "Leave Requests",
    icon: <ListAltRoundedIcon />,
    path: "/employee/leaves/requests",
  },
  {
    text: "Entitlements",
    icon: <PlaylistAddCheckRoundedIcon />,
    path: "/employee/leaves/entitlement",
    roles: ["HR Admin"],
  },
  {
    text: "Balance",
    icon: <BalanceRoundedIcon />,
    path: "/employee/leaves/balance",
    roles: [],
  },
  {
    text: "Calendar",
    icon: <CalendarViewDay />,
    path: "/employee/leaves/calendar",
    roles: ["HR Admin"],
  },
  {
    text: "History",
    icon: <History />,
    path: "/employee/leaves/history",
    roles: [],
  },
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
  const { roles: userRoles, loading } = useAuth();
  const [leavesOpen, setLeavesOpen] = useState(false);
  const isCandidate = pathname.startsWith("/candidate");
  const isPerformancePath = pathname.startsWith("/employee/performance");
  const isLeavesPath = pathname.startsWith("/employee/leaves");

  const visibleListItems = mainListItems.filter((item) => {
    // For candidates, only show the Home button
    if (isCandidate) {
      return item.text === "Home";
    }
    // Only apply role-based filtering after roles are loaded
    if (!loading) {
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
    if (text === 'Appraisal Review Hub' && pathname === '/employee/performance/manager-assignments') return true;
    if (text === 'My Performance' && pathname === '/employee/performance/my-records') return true;
    if (text === 'Manage Disputes' && pathname === '/employee/performance/manage-disputes') return true;
    if (text === 'Disputes' && pathname === '/employee/performance/disputes') return true;

    // Leaves submenu highlight
    if (text === 'Leave Requests' && pathname === '/employee/leaves/requests') return true;
    if (text === 'Leave Policies' && pathname === '/employee/leaves/policy') return true;
    if (text === 'Entitlements' && pathname === '/employee/leaves/entitlement') return true;
    if (text === 'Leave Types' && (pathname === '/employee/leaves/type' || pathname === '/employee/leaves/type/special')) return true;
    if (text === 'Calendar' && pathname === '/employee/leaves/calendar') return true;
    if (text === 'Requests Dashboard' && pathname === '/employee/leaves/requests/hr' ) return true;
    if (text === 'Requests Dashboard' && pathname === '/employee/leaves/requests/manager') return true;
    if (text === 'Approval Flow' && pathname === '/employee/leaves/requests/admin') return true;
    if (text === 'Balance' && pathname === '/employee/leaves/balance' ) return true;
    if (text === 'History' && pathname === '/employee/leaves/history') return true;
    if (text === 'Automation' && pathname === '/employee/leaves/automation') return true;
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
    if (text === 'Dashboard') router.push('/employee/leaves/hr');
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

        {/* Performance Dropdown - Only show for employees, not candidates */}
        {!isCandidate && (
          <>
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
                  // Only apply role-based filtering after roles are loaded
                  if (!loading) {
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
          </>
        )}
        {/* Leaves Dropdown (routes will be wired later) */}
        <ListItem disablePadding sx={{ display: "block" }}>
          <ListItemButton
            selected={isLeavesPath}
            onClick={() => setLeavesOpen(!leavesOpen)}
          >
            <ListItemIcon>
              <BeachAccessRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="Leaves" />
            {leavesOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
        </ListItem>

        <Collapse in={leavesOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {leavesSubItems.map((item, index) => {
              // Only apply role-based filtering on client side after hydration
              if (!loading) {
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
      </List>

      {/* Secondary items - Only show for employees, not candidates */}
      {!isCandidate && (
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
      )}
    </Stack>
  );
}
