"use client";
"use client";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
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
    text: "Clients",
    icon: <AssignmentRoundedIcon />,
    path: "/employee/clients",
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
];

const secondaryListItems = [
  { text: "Settings", icon: <SettingsRoundedIcon /> },
  { text: "About", icon: <InfoRoundedIcon /> },
  { text: "Feedback", icon: <HelpRoundedIcon /> },
];

export default function MenuContent() {
  const pathname = usePathname();
  const router = useRouter();

  const isCandidate = pathname.startsWith("/candidate");

  const visibleListItems = mainListItems.filter((item) => {
    if (isCandidate && item.text === "Team") return false;
    return true;
  });

  const isSelected = (text: string) => {
    if (
      text === "Home" &&
      (pathname === "/employee/dashboard" ||
        pathname === "/candidate/dashboard")
    )
      return true;
    if (text === "Team" && pathname === "/employee/team") return true;
    if (text === "Analytics" && pathname === "/employee/analytics") return true;
    if (text === "Settings" && pathname === "/employee/settings") return true;
    if (text === "Calendar" && pathname === "/employee/calendar") return true;
    if (text === "Clients" && pathname === "/employee/clients") return true;
    if (text === "Time Management" && pathname === "/employee/time-mangemeant")
      return true;
    if (
      text === "Manage Organization" &&
      pathname === "/employee/manage-organization"
    )
      return true;
    return false;
  };

  const handleNavigation = (text: string) => {
    if (text === "Home") {
      if (isCandidate) {
        router.push("/candidate/dashboard");
      } else {
        router.push("/employee/dashboard");
      }
    }
    if (text === "Team") router.push("/employee/team");
    if (text === "Analytics") router.push("/employee/analytics");
    if (text === "Settings") router.push("/employee/settings");
    if (text === "Calendar") router.push("/employee/calendar");
    if (text === "Clients") router.push("/employee/clients");
    if (text === "Time Management") router.push("/employee/time-mangemeant");
    if (text === "Manage Organization")
      router.push("/employee/manage-organization");
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
