"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";

import StatCard, {
  StatCardProps,
} from "../../../../../common/material-ui/dashboard/components/StatCard";

type OverviewMetricsProps = {
  metrics: StatCardProps[];
  loading: boolean;
  userRoles?: string[];
  onExport?: () => void;
};

function normalizeRole(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export default function OverviewMetrics({
  metrics,
  loading,
  userRoles,
  onExport,
}: OverviewMetricsProps) {
  const normalizedRoles = (userRoles || []).map(normalizeRole).filter(Boolean);
  const canExport = normalizedRoles.some((role) =>
    [
      "hr manager",
      "hr admin",
      "hr employee",
      "payroll specialist",
      "system admin",
    ].includes(role)
  );

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }
    // Fallback lightweight export: print the dashboard section
    try {
      window.print();
    } catch (err) {
      console.warn("Export fallback (print) failed", err);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "repeat(1, minmax(0, 1fr))",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} variant="rounded" height={160} />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "repeat(1, minmax(0, 1fr))",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
      }}
    >
      {canExport && (
        <Box
          sx={{
            gridColumn: "1 / -1",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button variant="outlined" size="small" onClick={handleExport}>
            Export overtime & exceptions
          </Button>
        </Box>
      )}
      {metrics.map((metric) => (
        <StatCard key={metric.title} {...metric} />
      ))}
    </Box>
  );
}
