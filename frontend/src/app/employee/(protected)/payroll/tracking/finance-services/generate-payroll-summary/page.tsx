'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme, alpha } from '@mui/material/styles';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { isAuthenticated } from '@/lib/auth-utils';

export default function GeneratePayrollSummaryPage() {
  const router = useRouter();
  const theme = useTheme();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    year: new Date().getFullYear(),
    month: 1,
    summary_type: '' as 'Month-End' | 'Year-End' | '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.year || formData.year < 2000 || formData.year > 2100) {
      setError('Valid year is required (between 2000 and 2100)');
      return;
    }
    if (!formData.summary_type) {
      setError('Summary type is required');
      return;
    }
    if (formData.summary_type === 'Month-End' && (!formData.month || formData.month < 1 || formData.month > 12)) {
      setError('Valid month is required (1-12) for Month-End summary');
      return;
    }

    setSubmitting(true);
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        router.push('/employee/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
      const response = await fetch(`${apiUrl}/tracking/reports/payroll-summary`, {
        method: 'POST',
        credentials: 'include', // Primary: send httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: formData.year,
          month: formData.summary_type === 'Month-End' ? formData.month : undefined,
          summary_type: formData.summary_type,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store summary data in sessionStorage and navigate to view page
        sessionStorage.setItem('payrollSummaryData', JSON.stringify(data));
        router.push('/employee/payroll/tracking/finance-services/generate-payroll-summary/view-summary');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to generate payroll summary');
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      setError('An error occurred while generating the summary');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <Box
      sx={{
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        '& *': {
          fontFamily: 'inherit',
        },
        maxWidth: '1200px',
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/employee/payroll/tracking/finance-services')}
          sx={{ mb: 2, textTransform: 'none' }}
        >
          Back to Dashboard
        </Button>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 1,
          }}
        >
          <AssessmentIcon
            sx={{
              fontSize: 40,
              color: 'primary.main',
              opacity: 0.9,
            }}
          />
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem' },
                letterSpacing: '-0.02em',
                color: 'text.primary',
                mb: 0.5,
              }}
            >
              Generate Payroll Summary
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: '1rem',
                fontWeight: 400,
                opacity: 0.8,
              }}
            >
              Generate month-end or year-end payroll summaries based on payroll periods for accounting compliance
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            fontFamily: 'inherit',
            '& .MuiAlert-message': {
              fontWeight: 500,
            },
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Box>
        {/* Form Card */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            background: theme.palette.background.paper,
            flex: 1,
            transition: 'box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            },
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3.5 }}>
              <AssessmentIcon
                sx={{
                  fontSize: 28,
                  color: 'primary.main',
                  opacity: 0.9,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.01em',
                }}
              >
                Generate Summary
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                {/* Summary Type Section */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1.5,
                      fontWeight: 600,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Summary Configuration
                  </Typography>
                  <FormControl
                    fullWidth
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: '2px',
                          },
                        },
                        '&.Mui-focused': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.06),
                        },
                      },
                    }}
                  >
                    <InputLabel
                      sx={{
                        fontWeight: 500,
                        '&.Mui-focused': {
                          color: 'primary.main',
                          fontWeight: 600,
                        },
                      }}
                    >
                      Summary Type *
                    </InputLabel>
                    <Select
                      value={formData.summary_type}
                      onChange={(e: SelectChangeEvent<string>) => setFormData({ ...formData, summary_type: e.target.value as 'Month-End' | 'Year-End' })}
                      label="Summary Type *"
                      sx={{
                        borderRadius: 2.5,
                        '& .MuiSelect-select': {
                          py: 1.75,
                          fontWeight: 500,
                        },
                      }}
                    >
                      <MenuItem value="Month-End">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssessmentIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>Month-End</Typography>
                            <Typography variant="caption" color="text.secondary">Monthly payroll summary</Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                      <MenuItem value="Year-End">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssessmentIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>Year-End</Typography>
                            <Typography variant="caption" color="text.secondary">Annual payroll summary</Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Period Section */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1.5,
                      fontWeight: 600,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Period Selection
                  </Typography>
                  <TextField
                    label="Year *"
                    type="number"
                    value={formData.year}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    required
                    fullWidth
                    inputProps={{ min: 2000, max: 2100 }}
                    InputLabelProps={{
                      shrink: true,
                      sx: {
                        fontWeight: 500,
                        '&.Mui-focused': {
                          color: 'primary.main',
                          fontWeight: 600,
                        },
                      },
                    }}
                    helperText={
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.75rem',
                          lineHeight: 1.5,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 0.5,
                          mt: 1
                        }}
                      >
                        <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', mt: 0.25, flexShrink: 0 }} />
                        <span>
                          Enter a 4-digit year (e.g., 2025)
                        </span>
                      </Typography>
                    }
                    sx={{
                      mb: formData.summary_type === 'Month-End' ? 2 : 0,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: '2px',
                          },
                        },
                        '&.Mui-focused': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.06),
                        },
                        '& .MuiOutlinedInput-input': {
                          py: 1.75,
                          fontWeight: 500,
                        },
                      },
                    }}
                  />
                  {formData.summary_type === 'Month-End' && (
                    <FormControl
                      fullWidth
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2.5,
                          backgroundColor: alpha(theme.palette.primary.main, 0.02),
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main',
                              borderWidth: '2px',
                            },
                          },
                          '&.Mui-focused': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.06),
                          },
                        },
                      }}
                    >
                      <InputLabel
                        sx={{
                          fontWeight: 500,
                          '&.Mui-focused': {
                            color: 'primary.main',
                            fontWeight: 600,
                          },
                        }}
                      >
                        Month *
                      </InputLabel>
                      <Select
                        value={String(formData.month)}
                        onChange={(e: SelectChangeEvent<string>) => setFormData({ ...formData, month: parseInt(e.target.value, 10) })}
                        label="Month *"
                        sx={{
                          borderRadius: 2.5,
                          '& .MuiSelect-select': {
                            py: 1.75,
                            fontWeight: 500,
                          },
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                          <MenuItem key={month} value={String(month)}>
                            {new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  sx={{
                    mt: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.75,
                    borderRadius: 2,
                    fontSize: '1rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <AssessmentIcon />}
                >
                  {submitting ? 'Generating...' : 'Generate Summary'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

