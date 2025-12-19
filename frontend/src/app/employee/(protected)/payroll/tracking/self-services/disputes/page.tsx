'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import { alpha, useTheme } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GavelIcon from '@mui/icons-material/Gavel';
import SearchAndDateFilter from '@/common/components/payroll/SearchAndDateFilter';
import { useTableFilters } from '@/common/components/payroll/useTableFilters';
import { formatDate, getStatusColor, formatStatusLabel } from '../../utils';
import { apiClient } from '@/common/utils/api/client';

interface Dispute {
  _id: string;
  disputeId: string;
  payslipId: string | { _id: string; toString: () => string };
  description: string;
  status: string;
  rejectionReason?: string;
  resolutionComment?: string;
  approvedRefundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function DisputesPage() {
  const router = useRouter();
  const theme = useTheme();
  const [disputes, setDisputes] = React.useState<Dispute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Table filters
  const {
    filteredData: filteredDisputes,
    filters,
    updateSearch,
    updateStartDate,
    updateEndDate,
    clearFilters,
  } = useTableFilters<Dispute>(
    disputes,
    ['disputeId', 'description', 'status'],
    'createdAt',
    'month'
  );

  React.useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    setLoading(true);
    setError(null);
    const response = await apiClient.get<Dispute[]>('/tracking/disputes');
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      // Transform the data to ensure all fields are properly extracted
      const transformedDisputes = Array.isArray(response.data) ? response.data.map((dispute: any) => ({
        _id: dispute._id?.toString() || dispute._id || '',
        disputeId: dispute.disputeId || dispute.dispute_id || '',
        payslipId: typeof dispute.payslipId === 'object' 
          ? dispute.payslipId._id?.toString() || dispute.payslipId.toString() 
          : dispute.payslipId?.toString() || dispute.payslip_id || '',
        description: dispute.description || '',
        status: dispute.status || 'Unknown',
        rejectionReason: dispute.rejectionReason || null,
        resolutionComment: dispute.resolutionComment || null,
        approvedRefundAmount: dispute.approvedRefundAmount || null,
        createdAt: dispute.createdAt || dispute.created_at || '',
        updatedAt: dispute.updatedAt || dispute.updated_at || '',
      })) : [];
      setDisputes(transformedDisputes);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        '& *': {
          fontFamily: 'inherit',
        },
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            mb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GavelIcon 
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
                Payroll Disputes
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
                Submit and track your payroll disputes here
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            onClick={() => router.push('/employee/payroll/tracking/self-services')}
            sx={{
              height: 42,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Back to Dashboard
          </Button>
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

      {disputes.length > 0 && (
        <SearchAndDateFilter
          searchValue={filters.searchTerm}
          onSearchChange={updateSearch}
          startDate={filters.startDate}
          onStartDateChange={updateStartDate}
          endDate={filters.endDate}
          onEndDateChange={updateEndDate}
          searchPlaceholder="Search by Dispute ID, description, or status..."
          dateFilterType="month"
          onClear={clearFilters}
        />
      )}

      {disputes.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 'none',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.paper, 0.6),
          }}
        >
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <GavelIcon 
              sx={{ 
                fontSize: 64, 
                color: 'text.disabled',
                mb: 2,
                opacity: 0.5,
              }} 
            />
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{
                fontWeight: 500,
                fontSize: '1.1rem',
              }}
            >
              No disputes found
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 1,
                opacity: 0.7,
              }}
            >
              Your disputes will appear here once submitted
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer 
          component={Paper}
          sx={{
            borderRadius: 3,
            boxShadow: 'none',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            overflow: 'hidden',
            background: alpha(theme.palette.background.paper, 0.6),
          }}
        >
          <Table sx={{ fontFamily: 'inherit' }}>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  '& th': {
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    color: 'text.primary',
                    borderBottom: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
                    py: 2,
                  },
                }}
              >
                <TableCell>Dispute ID</TableCell>
                <TableCell>Payslip ID</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDisputes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No disputes match your search criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDisputes.map((dispute) => (
                <TableRow 
                  key={dispute._id} 
                  hover
                  sx={{
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.03),
                      transform: 'translateX(2px)',
                    },
                    '& td': {
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      py: 2.5,
                      fontSize: '0.95rem',
                    },
                    '&:last-child td': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                    }}
                  >
                    {dispute.disputeId || 'N/A'}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                    }}
                  >
                    {typeof dispute.payslipId === 'string' 
                      ? dispute.payslipId 
                      : dispute.payslipId?.toString() || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        maxWidth: 400,
                        color: 'text.primary',
                        fontWeight: 400,
                      }}
                    >
                      {dispute.description || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatStatusLabel(dispute.status)}
                      color={getStatusColor(dispute.status) as any}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 28,
                        '& .MuiChip-label': {
                          px: 1.5,
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                    }}
                  >
                    {formatDate(dispute.createdAt)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/employee/payroll/tracking/self-services/disputes/${dispute.disputeId || dispute._id}?from=my-disputes`)}
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                      title="View Details"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

    </Box>
  );
}
