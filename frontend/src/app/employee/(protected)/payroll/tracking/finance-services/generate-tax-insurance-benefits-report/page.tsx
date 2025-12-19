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
import Select from '@mui/material/Select';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme, alpha } from '@mui/material/styles';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import { formatCurrency } from '../../utils';
import { isAuthenticated } from '@/lib/auth-utils';

export default function GenerateTaxInsuranceBenefitsReportPage() {
  const router = useRouter();
  const theme = useTheme();
  const [submitting, setSubmitting] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [reportData, setReportData] = React.useState<any>(null);

  const [formData, setFormData] = React.useState({
    document_id: `TAX-REPORT-${Date.now()}`,
    document_type: '' as 'Annual Tax Statement' | 'Monthly Tax Summary' | '',
    year: new Date().getFullYear(),
    month: 1,
    file_url: 'https://example.com/reports',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setReportData(null);

    // Validation
    if (!formData.document_type) {
      setError('Document type is required');
      return;
    }
    if (!formData.year || formData.year < 2000 || formData.year > 2100) {
      setError('Valid year is required (between 2000 and 2100)');
      return;
    }
    if (formData.document_type === 'Monthly Tax Summary' && (!formData.month || formData.month < 1 || formData.month > 12)) {
      setError('Valid month is required (1-12) for Monthly Tax Summary');
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
      const response = await fetch(`${apiUrl}/tracking/reports/tax-insurance-benefits/department`, {
        method: 'POST',
        credentials: 'include', // Primary: send httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: formData.document_id,
          document_type: formData.document_type,
          year: formData.year,
          month: formData.document_type === 'Monthly Tax Summary' ? formData.month : undefined,
          file_url: formData.file_url,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        setSuccess('Report generated successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError('An error occurred while generating the report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportData) return;

    setDownloading(true);
    setError(null);
    try {
      // Check both cookie-based auth and localStorage fallback
      if (!isAuthenticated() && !localStorage.getItem('access_token')) {
        router.push('/employee/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
      const response = await fetch(`${apiUrl}/tracking/reports/tax-insurance-benefits/download-pdf`, {
        method: 'POST',
        credentials: 'include', // Primary: send httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        setError('Failed to download report PDF');
        return;
      }

      // Get the PDF blob
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'tax-insurance-benefits-report.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      } else {
        // Generate filename
        const documentType = reportData.documentType || 'Report';
        const year = reportData.year || new Date().getFullYear();
        const month = reportData.month || '';
        const sanitizedDocumentType = documentType.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        filename = `TaxInsuranceBenefitsReport_${sanitizedDocumentType}_${year}${month ? `_${month}` : ''}.pdf`;
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess('Report downloaded successfully!');
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('An error occurred while downloading the report');
    } finally {
      setDownloading(false);
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
              Generate Tax/Insurance/Benefits Report
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
              Generate reports about taxes, insurance contributions, and benefits grouped by updatedAt
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

      {success && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius: 2,
            fontFamily: 'inherit',
            '& .MuiAlert-message': {
              fontWeight: 500,
            },
          }}
          onClose={() => setSuccess(null)}
        >
          {success}
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
            mb: 3,
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
                Generate Report
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                {/* Document Type Section */}
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
                    Report Configuration
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
                      Document Type *
                    </InputLabel>
                    <Select
                      value={formData.document_type}
                      onChange={(e) => setFormData({ ...formData, document_type: e.target.value as any })}
                      label="Document Type *"
                      sx={{
                        borderRadius: 2.5,
                        '& .MuiSelect-select': {
                          py: 1.75,
                          fontWeight: 500,
                        },
                      }}
                    >
                      <MenuItem value="Annual Tax Statement">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssessmentIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>Annual Tax Statement</Typography>
                            <Typography variant="caption" color="text.secondary">Yearly tax report grouped by updatedAt</Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                      <MenuItem value="Monthly Tax Summary">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssessmentIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>Monthly Tax Summary</Typography>
                            <Typography variant="caption" color="text.secondary">Monthly report grouped by updatedAt</Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Year Section */}
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
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
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
                    sx={{
                      mb: formData.document_type === 'Monthly Tax Summary' ? 2 : 0,
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
                  {formData.document_type === 'Monthly Tax Summary' && (
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
                        value={formData.month}
                        onChange={(e) => setFormData({ ...formData, month: e.target.value as number })}
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
                          <MenuItem key={month} value={month}>
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
                  {submitting ? 'Generating...' : 'Generate Report'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>

        {/* Report Results Card */}
        {reportData && (
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
              background: theme.palette.background.paper,
              mt: 3,
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Report Results
                </Typography>
                <Button
                  variant="contained"
                  startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  {downloading ? 'Downloading...' : 'Download PDF'}
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Document Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {reportData.documentType}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Year
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {reportData.year}
                  </Typography>
                </Box>

                {reportData.period && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Period
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {reportData.period}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Total Payslips
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {reportData.totalPayslipsCount || 0}
                  </Typography>
                </Box>

                {reportData.groups && reportData.groups.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Period Groups
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {reportData.groups.length} {reportData.groups.length === 1 ? 'group' : 'groups'}
                    </Typography>
                  </Box>
                )}

                {reportData.grandTotalTaxAmount && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Grand Total Tax
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {formatCurrency(reportData.grandTotalTaxAmount)}
                    </Typography>
                  </Box>
                )}
                {reportData.grandTotalInsuranceAmount && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Grand Total Insurance
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {formatCurrency(reportData.grandTotalInsuranceAmount)}
                    </Typography>
                  </Box>
                )}
                {reportData.grandTotalBenefitsAmount && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Grand Total Benefits
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {formatCurrency(reportData.grandTotalBenefitsAmount)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}

