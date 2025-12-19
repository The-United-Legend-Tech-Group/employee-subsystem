import { Typography, Stack, Pagination, Box } from '@mui/material';
import React from 'react';

export interface SyncedHoliday {
  name: string;
  startDate: string;
  endDate?: string;
}

export default function PaginatedSyncedHolidays({
  holidays,
  holidaysPerPage,
}: {
  holidays: SyncedHoliday[];
  holidaysPerPage?: number;
}) {
  const perPage = holidaysPerPage || 10;
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(holidays.length / perPage) || 1;

  React.useEffect(() => {
    // reset page if holidays array changes
    setPage(1);
  }, [holidays]);

  const start = (page - 1) * perPage;
  const end = start + perPage;
  const sliced = holidays.slice(start, end);

  if (holidays.length === 0) return (
    <Typography variant="body2" color="text.secondary">No synced holidays found.</Typography>
  );

  return (
    <Box>
      <Stack spacing={1} mb={1}>
        {sliced.map((h, idx) => (
          <Typography key={start + idx} variant="body2">
            • {h.name} ({new Date(h.startDate).toLocaleDateString()} - {h.endDate ? new Date(h.endDate).toLocaleDateString() : 'N/A'})
          </Typography>
        ))}
      </Stack>
      {holidays.length > perPage && (
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, v) => setPage(v)}
          sx={{ mt: 1 }}
          size="small"
          color="primary"
        />
      )}
    </Box>
  );
}



