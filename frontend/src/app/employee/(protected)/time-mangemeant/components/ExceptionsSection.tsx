"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import SectionHeading from "./SectionHeading";
import { HolidayDefinition, SectionDefinition } from "./types";

type ExceptionsSectionProps = {
  section: SectionDefinition;
  holidays: HolidayDefinition[];
  loading: boolean;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeHolidays(holidays: HolidayDefinition[]) {
  const now = Date.now();
  return holidays
    .slice()
    .sort(
      (a, b) =>
        new Date(a.startDate || 0).getTime() -
        new Date(b.startDate || 0).getTime()
    )
    .filter((holiday) => {
      if (!holiday.startDate) return false;
      return new Date(holiday.startDate).getTime() >= now - 86_400_000;
    })
    .slice(0, 6);
}

export default function ExceptionsSection({
  section,
  holidays,
  loading,
}: ExceptionsSectionProps) {
  const upcomingHolidays = React.useMemo(
    () => normalizeHolidays(holidays),
    [holidays]
  );

  return (
    <Box>
      <SectionHeading {...section} />
      <Card variant="outlined">
        <CardContent>
          {loading ? (
            <Stack spacing={2}>
              <Skeleton variant="text" width={280} height={32} />
              <Skeleton variant="rounded" height={220} />
            </Stack>
          ) : (
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              alignItems="stretch"
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ mb: 1 }}
                >
                  Upcoming holidays & weekly rest
                </Typography>
                {upcomingHolidays.length === 0 ? (
                  <Alert severity="info">
                    No upcoming holidays configured.
                  </Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {upcomingHolidays.map((holiday) => (
                      <Box
                        key={holiday._id}
                        sx={{
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          p: 2,
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          justifyContent="space-between"
                        >
                          <Stack spacing={0.5}>
                            <Typography fontWeight="bold">
                              {holiday.name || "Holiday"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(holiday.startDate)}
                              {holiday.endDate
                                ? ` → ${formatDate(holiday.endDate)}`
                                : ""}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {holiday.type && (
                              <Chip
                                size="small"
                                label={holiday.type}
                                color="info"
                                variant="outlined"
                              />
                            )}
                            {holiday.weeklyDays?.map((day) => (
                              <Chip
                                key={day}
                                size="small"
                                label={day}
                                variant="outlined"
                              />
                            ))}
                          </Stack>
                        </Stack>
                        {holiday.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            {holiday.description}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
              {/* Payroll corrections table removed per request. */}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
