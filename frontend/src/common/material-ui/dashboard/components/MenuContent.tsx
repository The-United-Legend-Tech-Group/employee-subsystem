"use client";
import { useState, useEffect } from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Skeleton from "@mui/material/Skeleton";
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
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
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
import { useAuth } from "@/hooks/use-auth";
import { SystemRole } from "@/types/auth";

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
  { text: "Manager Hub", icon: <PeopleRoundedIcon />, path: "/employee/team", roles: ["department head"] },
  {
    text: "Time Management",
    icon: <AccessTimeRoundedIcon />,
    path: "/employee/time-mangemeant",
  },
  {
    text: "Manage Organization",
    icon: <ApartmentRoundedIcon />,
    path: "/employee/manage-organization",
    roles: ["System Admin", "HR Manager"]
  },
  { text: 'Employee Requests', icon: <EditNoteRoundedIcon />, path: '/employee/manage-requests', roles: ["HR Admin", "HR Manager"] },
  { text: 'Manage Employees', icon: <PeopleRoundedIcon />, path: '/employee/manage-employees', roles: ["HR Admin", "HR Manager"] },
  { text: 'Compose Notification', icon: <SendTwoToneIcon />, path: '/employee/compose-notification', roles: ["System Admin", "HR Admin", "HR Manager", "department head"] },
  { text: 'Organization Changes', icon: <AssignmentRoundedIcon />, path: '/employee/manage-structure-requests', roles: ["System Admin", "HR Manager"] },
  {
    text: "Payroll",
    icon: <AccountBalanceRoundedIcon />,
    path: "/employee/payroll",
  },
];

export const performanceSubItems: MenuItem[] = [
  {
    text: "Dashboard",
    icon: <DashboardRoundedIcon />,
    path: "/employee/performance/dashboard",
    roles: ["HR Manager", "HR Admin"]
  },
  {
    text: "Performance Templates",
    icon: <AssessmentRoundedIcon />,
    path: "/employee/performance/templates",
    roles: ["HR Manager", "HR Admin"]
  },
  {
    text: "Appraisal Cycles",
    icon: <AccessTimeRoundedIcon />,
    path: "/employee/performance/cycles",
    roles: ["HR Manager", "HR Admin"]
  },
  {
    text: "Appraisal Assignments",
    icon: <AssignmentRoundedIcon />,
    path: "/employee/performance/assignments",
    roles: ["HR Employee", "HR Manager", "HR Admin"]
  },
  {
    text: "Appraisal Monitoring",
    icon: <VisibilityRoundedIcon />,
    path: "/employee/performance/monitoring",
    roles: ["HR Employee", "HR Manager", "HR Admin"]
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
    roles: ["HR Employee", "HR Manager", "HR Admin"]
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
    roles: ["HR Manager", "HR Admin"]
  },
  {
    text: "Disputes",
    icon: <ReportProblemRoundedIcon />,
    path: "/employee/performance/disputes",
  },
];

export const payrollSubItems: MenuItem[] = [
  {
    text: "Configuration",
    icon: <SettingsRoundedIcon />,
    path: "/employee/payroll/config_setup",
    roles: ["Payroll Specialist", "Payroll Manager", "System Admin", "Legal & Policy Admin", "HR Manager"],
  },
  {
    text: "Execution",
    icon: <AccountBalanceRoundedIcon />,
    path: "/employee/payroll/execution",
    roles: ["Payroll Specialist", "Payroll Manager", "Finance Staff"],
  },
  {
    text: "Tracking",
    icon: <VisibilityRoundedIcon />,
    path: "/employee/payroll/tracking",
  },
];

export const trackingSubItems: MenuItem[] = [
  {
    text: "Self Service",
    icon: <VisibilityRoundedIcon />,
    path: "/employee/payroll/tracking/self-services",
  },
  {
    text: "Specialist Services",
    icon: <AssignmentRoundedIcon />,
    path: "/employee/payroll/tracking/specialist-services",
    roles: ["Payroll Specialist"],
  },
  {
    text: "Manager Services",
    icon: <AccountBalanceRoundedIcon />,
    path: "/employee/payroll/tracking/manager-services",
    roles: ["Payroll Manager"],
  },
  {
    text: "Finance Services",
    icon: <AccountBalanceRoundedIcon />,
    path: "/employee/payroll/tracking/finance-services",
    roles: ["Finance Staff"],
  },
];

export const recruitmentSubItems: MenuItem[] = [
  { text: 'Overview', icon: <AssignmentRoundedIcon />, path: '/employee/recruitment_sub', roles: ['System Admin'] },
  { text: 'Employee', icon: <PeopleRoundedIcon />, path: '/employee/recruitment_sub/employee', roles: ['department employee', 'HR Employee', 'HR Manager', 'System Admin'] },
  { text: 'HR Employee', icon: <PeopleRoundedIcon />, path: '/employee/recruitment_sub/hr-employee', roles: ['HR Manager', 'HR Employee'] },
  { text: 'HR Manager', icon: <PeopleRoundedIcon />, path: '/employee/recruitment_sub/hr-manager', roles: ['HR Manager'] },
  { text: 'System Admin', icon: <PeopleRoundedIcon />, path: '/employee/recruitment_sub/system-admin', roles: ['System Admin'] },
];



export const candidateRecruitmentSubItems: MenuItem[] = [
  { text: 'Overview', icon: <AssignmentRoundedIcon />, path: '/candidate/recruitment_sub' },
];

const secondaryListItems = [
  { text: "Settings", icon: <SettingsRoundedIcon /> },
  { text: "About", icon: <InfoRoundedIcon /> },
  { text: "Feedback", icon: <HelpRoundedIcon /> },
];

export default function MenuContent() {
  const pathname = usePathname();
  const router = useRouter();

  // State for expandables
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);

  // Hooks
  const [recruitmentOpen, setRecruitmentOpen] = useState(false);
  const { roles: userRoles, loading } = useAuth();

  const isCandidate = pathname.startsWith("/candidate");
  const isPerformancePath = pathname.startsWith("/employee/performance");
  const isRecruitmentPath = pathname.includes('/recruitment_sub');

  // Auto-expand payroll menu if on any payroll route
  useEffect(() => {
    if (pathname.startsWith("/employee/payroll")) {
      setPayrollOpen(true);
      // Auto-expand tracking menu if on tracking route
      if (pathname.startsWith("/employee/payroll/tracking")) {
        setTrackingOpen(true);
      }
    }
  }, [pathname]);

  // Show skeleton while loading
  if (loading) {
    return (
      <Stack sx={{ flexGrow: 1, p: 1, justifyContent: "space-between" }}>
        <List dense>
          {[1, 2, 3, 4, 5].map((i) => (
            <ListItem key={i} disablePadding sx={{ display: "block" }}>
              <ListItemButton disabled>
                <ListItemIcon>
                  <Skeleton variant="circular" width={24} height={24} />
                </ListItemIcon>
                <Skeleton variant="text" width={100} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Stack>
    );
  }

  const visibleListItems = mainListItems.filter((item) => {
    // For candidates, only show the Home button
    if (isCandidate) {
      return item.text === "Home";
    }
    // Apply role-based filtering
    if (item.roles && item.roles.length > 0 && !item.roles.some((role) => userRoles.includes(role as SystemRole))) {
      return false;
    }
    return true;
  });

  const isSelected = (text: string) => {
    if (text === 'Home' && (pathname === '/employee/dashboard' || pathname === '/candidate/dashboard')) return true;
    if (text === 'Manager Hub' && pathname === '/employee/team') return true;
    if (text === 'Analytics' && pathname === '/employee/analytics') return true;
    if (text === 'Settings' && pathname === '/employee/settings') return true;
    if (text === 'Calendar' && pathname === '/employee/calendar') return true;
    if (text === 'Manage Organization' && pathname === '/employee/manage-organization') return true;
    if (text === 'Employee Requests') return pathname === '/employee/manage-requests';
    if (text === 'Manage Employees') return pathname.startsWith('/employee/manage-employees');
    if (text === 'Compose Notification') return pathname === '/employee/compose-notification';
    if (text === 'Organization Changes') return pathname === '/employee/manage-structure-requests';
    if (text === 'Time Management') return pathname === '/employee/time-mangemeant';

    // Payroll Check
    if (text === "Payroll" && pathname.startsWith("/employee/payroll")) return true;
    if (text === "Tracking" && pathname.startsWith("/employee/payroll/tracking")) return true;

    // Performance Checks
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
    if (text === 'Recruitment' && pathname.includes('/recruitment_sub')) return true;
    return false;
  };

  const isTrackingSubItemSelected = (path: string) => {
    if (!path) return false;
    // For self-services, check if it's the exact path or starts with it
    if (path === "/employee/payroll/tracking/self-services") {
      return pathname === path || pathname.startsWith(path + "/");
    }
    // For other services, check if pathname starts with the path
    return pathname.startsWith(path);
  };

  const handleNavigation = (text: string, path?: string) => {
    // Special Handler for Payroll Toggle
    if (text === "Payroll") {
      setPayrollOpen(!payrollOpen);
      return;
    }

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
    if (text === 'Manager Hub') router.push('/employee/team');
    if (text === 'Analytics') router.push('/employee/analytics');
    if (text === 'Settings') router.push('/employee/settings');
    if (text === 'Calendar') router.push('/employee/calendar');
    if (text === 'Organization Changes') router.push('/employee/manage-structure-requests');
    if (text === 'Manage Organization') router.push('/employee/manage-organization');
    if (text === 'Employee Requests') router.push('/employee/manage-requests');
    if (text === 'Manage Employees') router.push('/employee/manage-employees');
    if (text === 'Compose Notification') router.push('/employee/compose-notification');
    if (text === 'Time Management') router.push('/employee/time-mangemeant');
  };

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: "space-between" }}>
      <List dense>
        {visibleListItems.map((item, index) => {
          // --- PAYROLL RENDER LOGIC ---
          if (item.text === "Payroll") {
            return (
              <ListItem key={index} disablePadding sx={{ display: "block" }}>
                <ListItemButton
                  selected={isSelected(item.text)}
                  onClick={() => handleNavigation(item.text)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                  {payrollOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
                <Collapse in={payrollOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding dense>
                    {payrollSubItems.map((subItem, subIndex) => {
                      // Role check for items with roles
                      if (!loading) {
                        if (subItem.roles && subItem.roles.length > 0) {
                          if (!subItem.roles.some(role => userRoles.includes(role as SystemRole))) {
                            return null;
                          }
                        }
                      }

                      // Special handling for Tracking - make it expandable
                      if (subItem.text === "Tracking") {
                        return (
                          <Box key={subIndex} component="div">
                            <ListItemButton
                              sx={{ pl: 4 }}
                              selected={isSelected(subItem.text)}
                              onClick={() => setTrackingOpen(!trackingOpen)}
                            >
                              <ListItemIcon>{subItem.icon}</ListItemIcon>
                              <ListItemText primary={subItem.text} />
                              {trackingOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </ListItemButton>
                            <Collapse in={trackingOpen} timeout="auto" unmountOnExit>
                              <List component="div" disablePadding dense>
                                {trackingSubItems.map((trackingItem, trackingIndex) => {
                                  // Role check for tracking sub-items
                                  if (!loading) {
                                    if (trackingItem.roles && trackingItem.roles.length > 0) {
                                      if (!trackingItem.roles.some(role => userRoles.includes(role as SystemRole))) {
                                        return null;
                                      }
                                    }
                                  }

                                  return (
                                    <ListItemButton
                                      key={trackingIndex}
                                      sx={{ pl: 6 }}
                                      selected={isTrackingSubItemSelected(trackingItem.path || "")}
                                      onClick={() => trackingItem.path && router.push(trackingItem.path)}
                                    >
                                      <ListItemIcon>{trackingItem.icon}</ListItemIcon>
                                      <ListItemText primary={trackingItem.text} />
                                    </ListItemButton>
                                  );
                                })}
                              </List>
                            </Collapse>
                          </Box>
                        );
                      }

                      // Regular sub-items (Configuration, Execution)
                      return (
                        <ListItemButton
                          key={subIndex}
                          sx={{ pl: 4 }}
                          selected={pathname === subItem.path}
                          onClick={() => subItem.path && router.push(subItem.path)}
                        >
                          <ListItemIcon>{subItem.icon}</ListItemIcon>
                          <ListItemText primary={subItem.text} />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </ListItem>
            );
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
          )
        })}

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
                    if (item.roles && item.roles.length > 0 && !item.roles.some((role) => userRoles.includes(role as SystemRole))) {
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
            {(isCandidate ? candidateRecruitmentSubItems : recruitmentSubItems).map((item, index) => {
              // Only apply role-based filtering after roles are loaded
              if (!loading) {
                // @ts-ignore
                if (item.roles && item.roles.length > 0 && !item.roles.some((role) => userRoles.includes(role))) {
                  return null;
                }
              }
              return (
                <ListItem key={index} disablePadding sx={{ display: 'block' }}>
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