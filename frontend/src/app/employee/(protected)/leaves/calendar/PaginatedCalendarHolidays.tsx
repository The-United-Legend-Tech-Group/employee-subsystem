import { Box, Stack, Typography, Pagination } from '@mui/material';
import React from 'react';

export interface CalendarHolidayView {
  id: string;
  name?: string;
  startDate?: string;
  endDate?: string;
}

export default function PaginatedCalendarHolidays({
  holidays,
  perPage = 10,
}: {
  holidays: CalendarHolidayView[];
  perPage?: number;
}) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(holidays.length / perPage));

  React.useEffect(() => {
    setPage(1);
  }, [holidays, perPage]);

  if (!holidays || holidays.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No holidays configured
      </Typography>
    );
  }

  const start = (page - 1) * perPage;
  const slice = holidays.slice(start, start + perPage);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  return (
    <Box>
      <Stack spacing={0.5}>
        {slice.map((h, idx) => (
          <Typography
            key={start + idx}
            variant="body2"
            sx={{
              cursor: 'pointer',
              fontWeight: h.id === selectedId ? 600 : 400,
            }}
            onClick={() => setSelectedId(h.id)}
          >
            • {h.name || `Holiday ID: ${h.id}`}
            {h.startDate && (
              <>
                {' '}
                —{' '}
                {new Date(h.startDate).toLocaleDateString()}{' '}
                {h.endDate &&
                  h.endDate !== h.startDate && (
                    <>
                      {'- '}
                      {new Date(h.endDate).toLocaleDateString()}
                    </>
                  )}
              </>
            )}
          </Typography>
        ))}
      </Stack>
      {holidays.length > perPage && (
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


