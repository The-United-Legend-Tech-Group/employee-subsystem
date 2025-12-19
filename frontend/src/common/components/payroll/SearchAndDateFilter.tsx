'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { useTheme, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface SearchAndDateFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  startDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  endDate: Date | null;
  onEndDateChange: (date: Date | null) => void;
  searchPlaceholder?: string;
  showDateFilters?: boolean;
  dateFilterType?: 'day' | 'month' | 'year'; // For payslips, use month/year
  onClear?: () => void;
}

export default function SearchAndDateFilter({
  searchValue,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  searchPlaceholder = 'Search...',
  showDateFilters = true,
  dateFilterType = 'day',
  onClear,
}: SearchAndDateFilterProps) {
  const theme = useTheme();
  const [showFilters, setShowFilters] = React.useState(false);

  const handleClear = () => {
    onSearchChange('');
    onStartDateChange(null);
    onEndDateChange(null);
    if (onClear) {
      onClear();
    }
  };

  const hasActiveFilters = searchValue.trim() !== '' || startDate !== null || endDate !== null;

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: alpha(theme.palette.background.paper, 0.6),
      }}
    >
      <Grid container spacing={2} alignItems="center">
        {/* Search Field */}
        <Grid item xs={12} md={showDateFilters ? 4 : 8}>
          <TextField
            fullWidth
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: searchValue && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => onSearchChange('')}
                    sx={{ p: 0.5 }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.background.paper,
              },
            }}
          />
        </Grid>

        {/* Date Filters Toggle Button */}
        {showDateFilters && (
          <>
            <Grid item xs={12} md={2}>
              <Button
                variant={showFilters ? 'contained' : 'outlined'}
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                fullWidth
                size="small"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {showFilters ? 'Hide Filters' : 'Date Filters'}
                {hasActiveFilters && (
                  <Box
                    sx={{
                      ml: 1,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.error.main,
                    }}
                  />
                )}
              </Button>
            </Grid>

            {/* Clear Button */}
            {hasActiveFilters && (
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  onClick={handleClear}
                  fullWidth
                  size="small"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  Clear All
                </Button>
              </Grid>
            )}

            {/* Date Filters */}
            {showFilters && (
              <>
                {dateFilterType === 'day' ? (
                  <>
                    <Grid item xs={12} md={3}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Start Date"
                          value={startDate}
                          onChange={onStartDateChange}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                              sx: {
                                backgroundColor: theme.palette.background.paper,
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="End Date"
                          value={endDate}
                          onChange={onEndDateChange}
                          minDate={startDate || undefined}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                              sx: {
                                backgroundColor: theme.palette.background.paper,
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                  </>
                ) : dateFilterType === 'month' ? (
                  <>
                    <Grid item xs={12} md={3}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Start Month"
                          value={startDate}
                          onChange={onStartDateChange}
                          views={['year', 'month']}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                              sx: {
                                backgroundColor: theme.palette.background.paper,
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="End Month"
                          value={endDate}
                          onChange={onEndDateChange}
                          views={['year', 'month']}
                          minDate={startDate || undefined}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                              sx: {
                                backgroundColor: theme.palette.background.paper,
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={12} md={3}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Start Year"
                          value={startDate}
                          onChange={onStartDateChange}
                          views={['year']}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                              sx: {
                                backgroundColor: theme.palette.background.paper,
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="End Year"
                          value={endDate}
                          onChange={onEndDateChange}
                          views={['year']}
                          minDate={startDate || undefined}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                              sx: {
                                backgroundColor: theme.palette.background.paper,
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Spacer when filters are hidden */}
        {!showDateFilters && (
          <Grid item xs={12} md={4} />
        )}
      </Grid>
    </Box>
  );
}
