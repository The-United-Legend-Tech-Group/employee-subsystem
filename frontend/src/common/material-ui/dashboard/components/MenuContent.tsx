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
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
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
import { usePathname, useRouter } from "next/navigation";

const mainListItems = [
  { text: "Home", icon: <HomeRoundedIcon />, path: "/employee/dashboard" },
  {
    text: "Calendar",
    icon: <CalendarMonthRoundedIcon />,
    path: "/employee/calendar",
  },
  { text: "Team", icon: <PeopleRoundedIcon />, path: "/employee/team" },
  {
    text: "Analytics",
    icon: <AnalyticsRoundedIcon />,
    path: "/employee/analytics",
  },
  {
    text: "Time Management",
    icon: <AccessTimeRoundedIcon />,
    path: "/employee/time-mangemeant",
  },
  {
    text: "Manage Organization",
    icon: <ApartmentRoundedIcon />,
    path: "/employee/manage-organization",
  },
  { text: 'Manage Requests', icon: <EditNoteRoundedIcon />, path: '/employee/manage-requests' },
  { text: 'Manage Employees', icon: <PeopleRoundedIcon />, path: '/employee/manage-employees' },
];

const performanceSubItems = [
  {
    text: "Performance Dashboard",
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
    text: "Manager Appraisal Dashboard",
    icon: <AssignmentRoundedIcon />,
    path: "/employee/performance/manager",
  },
  {
    text: "My Assigned Appraisals",
    icon: <AssignmentRoundedIcon />,
    path: "/employee/performance/manager-assignments",
  },
  {
    text: "My Performance Records",
    icon: <AssessmentRoundedIcon />,
    path: "/employee/performance/my-records",
  },
  {
    text: "Disputes",
    icon: <ReportProblemRoundedIcon />,
    path: "/employee/performance/disputes",
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

  const isCandidate = pathname.startsWith("/candidate");
  const isPerformancePath = pathname.startsWith("/employee/performance");

  const visibleListItems = mainListItems.filter((item) => {
    if (isCandidate && item.text === "Team") return false;
    return true;
  });

  const isSelected = (text: string) => {
    if (text === 'Home' && (pathname === '/employee/dashboard' || pathname === '/candidate/dashboard')) return true;
    if (text === 'Team' && pathname === '/employee/team') return true;
    if (text === 'Analytics' && pathname === '/employee/analytics') return true;
    if (text === 'Settings' && pathname === '/employee/settings') return true;
    if (text === 'Calendar' && pathname === '/employee/calendar') return true;
    if (text === 'Submit Request' && pathname === '/employee/submit-request') return true;
    if (text === 'Manage Organization' && pathname === '/employee/manage-organization') return true;
    if (text === 'Manage Requests' && pathname === '/employee/manage-requests') return true;
    if (text === 'Manage Employees' && pathname.startsWith('/employee/manage-employees')) return true;
    if (text === 'Time Management' && pathname === '/employee/time-mangemeant') return true;
    if (text === 'Performance Dashboard' && pathname === '/employee/performance/dashboard') return true;
    if (text === 'Performance Templates' && pathname === '/employee/performance/templates') return true;
    if (text === 'Appraisal Cycles' && pathname === '/employee/performance/cycles') return true;
    if (text === 'Appraisal Assignments' && pathname === '/employee/performance/assignments') return true;
    if (text === 'Appraisal Monitoring' && pathname === '/employee/performance/monitoring') return true;
    if (text === 'Manager Appraisal Dashboard' && pathname === '/employee/performance/manager') return true;
    if (text === 'My Assigned Appraisals' && pathname === '/employee/performance/manager-assignments') return true;
    if (text === 'My Performance Records' && pathname === '/employee/performance/my-records') return true;
    if (text === 'Disputes' && pathname === '/employee/performance/disputes') return true;
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
    if (text === 'Submit Request') router.push('/employee/submit-request');
    if (text === 'Manage Organization') router.push('/employee/manage-organization');
    if (text === 'Manage Requests') router.push('/employee/manage-requests');
    if (text === 'Manage Employees') router.push('/employee/manage-employees');
    if (text === 'Time Management') router.push('/employee/time-mangemeant');
  };

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: "space-between" }}>
      <List dense>
        {visibleListItems.map((item, index) => (
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
            {performanceSubItems.map((item, index) => (
              <ListItem key={index} disablePadding sx={{ display: "block" }}>
                <ListItemButton
                  sx={{ pl: 4 }}
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
