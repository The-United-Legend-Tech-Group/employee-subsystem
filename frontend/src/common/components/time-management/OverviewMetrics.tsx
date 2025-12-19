"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

import StatCard, {
  StatCardProps,
} from "../../material-ui/dashboard/components/StatCard";

type OverviewMetricsProps = {
  metrics: StatCardProps[];
  loading: boolean;
};

export default function OverviewMetrics({
  metrics,
  loading,
}: OverviewMetricsProps) {
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
      {metrics.map((metric) => (
        <StatCard key={metric.title} {...metric} />
      ))}
    </Box>
  );
}
