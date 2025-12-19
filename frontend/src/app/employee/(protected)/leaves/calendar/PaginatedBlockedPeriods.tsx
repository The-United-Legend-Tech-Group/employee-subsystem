import { Box, Stack, Typography, Pagination, Divider } from '@mui/material';
import React from 'react';

export interface BlockedPeriodView {
  from: string | Date;
  to: string | Date;
  reason: string;
}

export default function PaginatedBlockedPeriods({
  periods,
  perPage = 4,
}: {
  periods: BlockedPeriodView[];
  perPage?: number;
}) {
  if (!periods || periods.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No blocked periods configured
      </Typography>
    );
  }

  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(periods.length / perPage));

  React.useEffect(() => {
    setPage(1);
  }, [periods, perPage]);

  const start = (page - 1) * perPage;
  const slice = periods.slice(start, start + perPage);

  const formatDate = (value: any) => {
    if (!value) return 'N/A';
    if (typeof value === 'object' && value.$date) {
      value = value.$date;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString();
  };

  return (
    <Box>
      <Stack spacing={0} divider={<Divider flexItem sx={{ my: 1, borderColor: 'divider' }} />}>
        {slice.map((bp, idx) => (
          <Box key={start + idx}>
            <Typography variant="body2">
              • <strong>{formatDate(bp.from)}</strong> to{' '}
              <strong>{formatDate(bp.to)}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {bp.reason}
            </Typography>
          </Box>
        ))}
      </Stack>
      {periods.length > perPage && (
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          size="small"
          sx={{ mt: 1 }}
        />
      )}
    </Box>
  );
}
