"use client";

import Tooltip from "@mui/material/Tooltip";
import type { SwitchProps } from "@mui/material/Switch";
import { useColorScheme } from "@mui/material/styles";

import { ColorModeToggleSwitch } from "./ColorModeSelect";

export default function ColorModeIconDropdown(props: SwitchProps) {
  const { mode, systemMode, setMode } = useColorScheme();

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
      <ColorModeToggleSwitch
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
