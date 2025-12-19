"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";

import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

export interface AttendanceFilterState {
  dateRange: "all" | "today" | "week" | "month" | "custom";
  customStartDate?: string;
  customEndDate?: string;
  hasMissedPunch?: boolean;
  finalisedForPayroll?: boolean;
  month?: string;
  year?: string;
}

interface AttendanceFiltersProps {
  filters: AttendanceFilterState;
  onFiltersChange: (filters: AttendanceFilterState) => void;
  activeFiltersCount: number;
}

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function AttendanceFilters({
  filters,
  onFiltersChange,
  activeFiltersCount,
}: AttendanceFiltersProps) {
  const [expanded, setExpanded] = React.useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleDateRangeChange = (value: AttendanceFilterState["dateRange"]) => {
    const newFilters: AttendanceFilterState = {
      ...filters,
      dateRange: value,
    };

    // Auto-populate dates based on selection
    const now = new Date();
    switch (value) {
      case "today":
        newFilters.customStartDate = now.toISOString().split("T")[0];
        newFilters.customEndDate = now.toISOString().split("T")[0];
        break;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        newFilters.customStartDate = weekAgo.toISOString().split("T")[0];
        newFilters.customEndDate = now.toISOString().split("T")[0];
        break;
      case "month":
        if (filters.month && filters.year) {
          const monthDate = new Date(`${filters.year}-${filters.month}-01`);
          const lastDay = new Date(
            parseInt(filters.year),
            parseInt(filters.month),
            0
          ).getDate();
          newFilters.customStartDate = `${filters.year}-${filters.month}-01`;
          newFilters.customEndDate = `${filters.year}-${filters.month}-${lastDay
            .toString()
            .padStart(2, "0")}`;
        }
        break;
      case "all":
        newFilters.customStartDate = undefined;
        newFilters.customEndDate = undefined;
        break;
    }

    onFiltersChange(newFilters);
  };

  const handleMonthChange = (month: string) => {
    const newFilters = { ...filters, month };
    if (filters.dateRange === "month" && filters.year) {
      const lastDay = new Date(
        parseInt(filters.year),
        parseInt(month),
        0
      ).getDate();
      newFilters.customStartDate = `${filters.year}-${month}-01`;
      newFilters.customEndDate = `${filters.year}-${month}-${lastDay
        .toString()
        .padStart(2, "0")}`;
    }
    onFiltersChange(newFilters);
  };

  const handleYearChange = (year: string) => {
    const newFilters = { ...filters, year };
    if (filters.dateRange === "month" && filters.month) {
      const lastDay = new Date(
        parseInt(year),
        parseInt(filters.month),
        0
      ).getDate();
      newFilters.customStartDate = `${year}-${filters.month}-01`;
      newFilters.customEndDate = `${year}-${filters.month}-${lastDay
        .toString()
        .padStart(2, "0")}`;
    }
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    onFiltersChange({
      dateRange: "all",
      customStartDate: undefined,
      customEndDate: undefined,
      hasMissedPunch: undefined,
      finalisedForPayroll: undefined,
      month: undefined,
      year: undefined,
    });
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <FilterListIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Filters
              </Typography>
              {activeFiltersCount > 0 && (
                <Chip
                  label={`${activeFiltersCount} active`}
                  size="small"
                  color="primary"
                />
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              {activeFiltersCount > 0 && (
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                >
                  Clear All
                </Button>
              )}
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
          </Stack>

          <Collapse in={expanded}>
            <Stack spacing={3}>
              {/* Date Range Selection */}
              <FormControl component="fieldset">
                <FormLabel component="legend">Date Range</FormLabel>
                <RadioGroup
                  value={filters.dateRange}
                  onChange={(e) =>
                    handleDateRangeChange(
                      e.target.value as AttendanceFilterState["dateRange"]
                    )
                  }
                >
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    <FormControlLabel
                      value="all"
                      control={<Radio />}
                      label="All Time"
                    />
                    <FormControlLabel
                      value="today"
                      control={<Radio />}
                      label="Today"
                    />
                    <FormControlLabel
                      value="week"
                      control={<Radio />}
                      label="Last 7 Days"
                    />
                    <FormControlLabel
                      value="month"
                      control={<Radio />}
                      label="By Month"
                    />
                    <FormControlLabel
                      value="custom"
                      control={<Radio />}
                      label="Custom"
                    />
                  </Stack>
                </RadioGroup>
              </FormControl>

              {/* Month Selection */}
              {filters.dateRange === "month" && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <FormControl fullWidth>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Month
                    </Typography>
                    <Select
                      value={filters.month || ""}
                      onChange={(e) => handleMonthChange(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">Select Month</MenuItem>
                      {MONTHS.map((month) => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Year
                    </Typography>
                    <Select
                      value={filters.year || ""}
                      onChange={(e) => handleYearChange(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">Select Year</MenuItem>
                      {years.map((year) => (
                        <MenuItem key={year} value={year.toString()}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              )}

              {/* Custom Date Range */}
              {filters.dateRange === "custom" && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={filters.customStartDate || ""}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        customStartDate: e.target.value,
                      })
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={filters.customEndDate || ""}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        customEndDate: e.target.value,
                      })
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Stack>
              )}

              {/* Status Filters */}
              <Box>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                  Status Filters
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.hasMissedPunch === true}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            hasMissedPunch: e.target.checked ? true : undefined,
                          })
                        }
                      />
                    }
                    label="Show only missed punches"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.finalisedForPayroll === false}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            finalisedForPayroll: e.target.checked
                              ? false
                              : undefined,
                          })
                        }
                      />
                    }
                    label="Show only unfinalized"
                  />
                </Stack>
              </Box>
            </Stack>
          </Collapse>
        </Stack>
      </CardContent>
    </Card>
  );
}
