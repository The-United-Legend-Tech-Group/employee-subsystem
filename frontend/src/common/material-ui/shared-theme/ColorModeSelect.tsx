"use client";

import Switch, { SwitchProps } from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import { styled, useColorScheme } from "@mui/material/styles";

const ModeSwitchRoot = styled(Switch)(({ theme }) => ({
  width: 64,
  height: 36,
  padding: 0,
  display: "flex",
  "& .MuiSwitch-switchBase": {
    padding: 4,
    transitionDuration: "420ms",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionProperty: "transform",
    "&.Mui-checked": {
      transform: "translateX(28px)",
      color: "#fff",
      // use theme background for the checked track so the toggle blends with the app background
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundImage: "none",
        backgroundColor:
          theme.palette.mode === "dark"
            ? theme.palette.background.default
            : "rgba(17, 44, 97, 0.85)",
      },
      "& .MuiSwitch-thumb:before": {
        backgroundImage:
          "url('data:image/svg+xml;utf8,<svg xmlns=" +
          '"http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>\')',
      },
      "& .MuiSwitch-thumb": {
        transform: "scale(1)",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.9)"
        : "rgba(18, 18, 18, 0.85)",
    width: 28,
    height: 28,
    borderRadius: "50%",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0px 6px 18px rgba(0, 0, 0, 0.35)"
        : "0px 6px 18px rgba(0, 0, 0, 0.25)",
    transition: theme.transitions.create(
      ["background-color", "box-shadow", "transform"],
      {
        duration: 360,
        easing: theme.transitions.easing.easeInOut,
      }
    ),
    transform: "scale(0.94)",
    "&:before": {
      content: "''",
      position: "absolute",
      inset: 0,
      margin: "auto",
      width: "60%",
      height: "60%",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage:
        'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>\')',
    },
  },
  "& .MuiSwitch-track": {
    borderRadius: 18,
    opacity: 1,
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(7, 25, 46, 0.8)"
        : "rgba(214, 221, 234, 0.9)",
    backgroundImage:
      theme.palette.mode === "dark"
        ? "linear-gradient(135deg, rgba(7, 25, 46, 0.95), rgba(7, 25, 46, 0.75))"
        : "linear-gradient(135deg, rgba(214, 221, 234, 0.95), rgba(214, 221, 234, 0.75))",
    backgroundSize: "200% 100%",
    backgroundPosition: "0% 50%",
    boxShadow:
      theme.palette.mode === "dark"
        ? "inset 0 0 0 1px rgba(255, 255, 255, 0.08)"
        : "inset 0 0 0 1px rgba(17, 44, 97, 0.08)",
    transition: theme.transitions.create(
      ["background-color", "background-position", "box-shadow"],
      {
        duration: 420,
        easing: theme.transitions.easing.easeInOut,
      }
    ),
  },
}));

export const ColorModeToggleSwitch = ModeSwitchRoot;

export default function ColorModeSelect(props: SwitchProps) {
  const { mode, setMode, systemMode } = useColorScheme();

  if (!mode) {
    return null;
  }

  const effectiveMode = mode === "system" ? systemMode ?? "light" : mode;
  const isDark = effectiveMode === "dark";
  const { sx, onChange, ...rest } = props;

  const handleToggle: NonNullable<SwitchProps["onChange"]> = (
    event,
    checked
  ) => {
    setMode(checked ? "dark" : "light");
    if (onChange) {
      onChange(event, checked);
    }
  };

  return (
    <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <ModeSwitchRoot
        data-screenshot="toggle-mode"
        disableRipple
        checked={isDark}
        onChange={handleToggle}
        sx={sx}
        {...rest}
        inputProps={{ "aria-label": "toggle color mode" }}
      />
    </Tooltip>
  );
}
