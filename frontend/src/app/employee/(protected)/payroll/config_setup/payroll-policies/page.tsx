'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import { useTheme, alpha } from '@mui/material/styles';
import PolicyIcon from '@mui/icons-material/Policy';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import {
  PageHeader,
  StatusChip,
  ConfigDialog,
  DeleteConfirmDialog,
} from '../_components';
import {
  payrollPoliciesApi,
  type PayrollPolicyResponse,
  type CreatePayrollPolicyDto,
  type UpdatePayrollPolicyDto,
  type UpdateStatusDto,
  PolicyType,
  Applicability,
} from '../_api/config-setup.api';
import { useConfigPermissions } from '../_utils/config-permissions';

export default function PayrollPoliciesPage() {
  const router = useRouter();
  const theme = useTheme();
  const permissions = useConfigPermissions('payroll-policies');

  const [policies, setPolicies] = React.useState<PayrollPolicyResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<PayrollPolicyResponse | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<PayrollPolicyResponse | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState<CreatePayrollPolicyDto>({
    policyName: '',
    policyType: PolicyType.ALLOWANCE,
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    ruleDefinition: {
      percentage: 0,
      fixedAmount: 0,
      thresholdAmount: 0,
    },
    applicability: Applicability.ALL_EMPLOYEES,
  });

  // Pagination & Filter states
  const [page, setPage] = React.useState(0);
  const [limit, setLimit] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [policyTypeFilter, setPolicyTypeFilter] = React.useState<string>('');
  const [statusFilter, setStatusFilter] = React.useState<string>('');

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  React.useEffect(() => {
    if (searchParams?.get('status')) {
      // Logic for status filter if needed, or just keep generic
    }
  }, []);

  const fetchPolicies = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await payrollPoliciesApi.findAll({
        page: page + 1,
        limit,
        search,
        policyType: policyTypeFilter as any,
        status: statusFilter as any
      });
      if (response.error) {
        setError(response.error);
        setPolicies([]);
      } else if (response.data) {
        setPolicies(response.data.data);
        setTotal(response.data.total);
      }
    } catch (err) {
      setError('Failed to fetch payroll policies');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, policyTypeFilter, statusFilter]);

  React.useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Handle Search Debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchPolicies();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Select Filters immediately
  React.useEffect(() => {
    setPage(0);
    fetchPolicies();
  }, [statusFilter, policyTypeFilter]);

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (item?: PayrollPolicyResponse) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        policyName: item.policyName,
        policyType: item.policyType,
        description: item.description,
        effectiveDate: item.effectiveDate.split('T')[0],
        ruleDefinition: item.ruleDefinition,
        applicability: item.applicability,
      });
    } else {
      setEditingItem(null);
      setFormData({
        policyName: '',
        policyType: PolicyType.ALLOWANCE,
        description: '',
        effectiveDate: new Date().toISOString().split('T')[0],
        ruleDefinition: {
          percentage: 0,
          fixedAmount: 0,
          thresholdAmount: 0,
        },
        applicability: Applicability.ALL_EMPLOYEES,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (editingItem) {
        const updateDto: UpdatePayrollPolicyDto = { ...formData };
        const response = await payrollPoliciesApi.update(editingItem._id, updateDto);
        if (response.error) {
          setError(response.error);
          return;
        }
        setSuccess('Payroll policy updated successfully');
      } else {
        const response = await payrollPoliciesApi.create(formData);
        if (response.error) {
          setError(response.error);
          return;
        }
        setSuccess('Payroll policy created successfully');
      }

      handleCloseDialog();
      fetchPolicies();
    } catch (err) {
      setError('Failed to save payroll policy');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      setSaving(true);
      const response = await payrollPoliciesApi.delete(deletingItem._id);
      if (response.error) {
        setError(response.error);
        return;
      }
      setSuccess('Payroll policy deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchPolicies();
    } catch (err) {
      setError('Failed to delete payroll policy');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const dto: UpdateStatusDto = { status };
      const response = await payrollPoliciesApi.updateStatus(id, dto);
      if (response.error) {
        setError(response.error);
        return;
      }
      setSuccess(`Payroll policy ${status} successfully`);
      fetchPolicies();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const getPolicyTypeColor = (type: PolicyType) => {
    switch (type) {
      case PolicyType.DEDUCTION:
        return theme.palette.error.main;
      case PolicyType.ALLOWANCE:
        return theme.palette.success.main;
      case PolicyType.BENEFIT:
        return theme.palette.info.main;
      case PolicyType.MISCONDUCT:
        return theme.palette.warning.main;
      case PolicyType.LEAVE:
        return theme.palette.secondary.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };


  return (
    <Box sx={{ fontFamily: 'inherit' }}>
      <PageHeader
        title="Payroll Policies"
        subtitle="Create and manage payroll policies for deductions, allowances, and benefits"
        icon={<PolicyIcon />}
        action={permissions.canCreate ? {
          label: 'Add Policy',
          onClick: () => handleOpenDialog(),
          icon: <AddIcon />,
        } : undefined}
        backButton={{
          label: 'Back to Config',
          onClick: () => router.push('/employee/payroll/config_setup'),
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, borderBottom: '1px solid #eee' }}>
          <TextField
            size="small"
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 300,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <TextField
            select
            size="small"
            label="Policy Type"
            value={policyTypeFilter}
            onChange={(e) => setPolicyTypeFilter(e.target.value)}
            sx={{ width: 180 }}
          >
            <MenuItem value="">All Types</MenuItem>
            {Object.values(PolicyType).map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ width: 150 }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </TextField>
        </Box>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress size={32} />
            </Box>
          ) : policies.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={8}>
              <PolicyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Payroll Policies Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Add Policy" to create your first payroll policy.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Policy Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Applicability</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Effective Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {policies.map((policy) => (
                      <TableRow key={policy._id} hover>
                        <TableCell>
                          <Box>
                            <Typography fontWeight={500}>{policy.policyName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {policy.description.substring(0, 50)}
                              {policy.description.length > 50 ? '...' : ''}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={policy.policyType}
                            size="small"
                            sx={{
                              bgcolor: alpha(getPolicyTypeColor(policy.policyType), 0.1),
                              color: getPolicyTypeColor(policy.policyType),
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{policy.applicability}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatDate(policy.effectiveDate)}</Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={policy.status} />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {policy.status === 'draft' && permissions.canApprove && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleUpdateStatus(policy._id, 'approved')}
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleUpdateStatus(policy._id, 'rejected')}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {permissions.canEdit && (
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => handleOpenDialog(policy)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {permissions.canDelete && (
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setDeletingItem(policy);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Rows per page:
                    <select
                      value={limit}
                      onChange={(e) => handleLimitChange(e as any)}
                      style={{ marginLeft: 8, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {page * limit + 1}-{Math.min((page + 1) * limit, total)} of {total}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>➤</span>
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setPage(p => p + 1)}
                      disabled={(page + 1) * limit >= total}
                    >
                      <span>➤</span>
                    </IconButton>
                  </Box>
                </Stack>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <ConfigDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        title={editingItem ? 'Edit Payroll Policy' : 'Add Payroll Policy'}
        onSubmit={handleSubmit}
        loading={saving}
        icon={<PolicyIcon />}
        maxWidth="md"
      >
        <Stack spacing={3}>
          <TextField
            label="Policy Name"
            fullWidth
            value={formData.policyName}
            onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
            placeholder="e.g., Health Insurance Deduction"
            required
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Policy Type"
              select
              fullWidth
              value={formData.policyType}
              onChange={(e) => setFormData({ ...formData, policyType: e.target.value as PolicyType })}
              required
            >
              {Object.values(PolicyType).map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Applicability"
              select
              fullWidth
              value={formData.applicability}
              onChange={(e) => setFormData({ ...formData, applicability: e.target.value as Applicability })}
              required
            >
              {Object.values(Applicability).map((app) => (
                <MenuItem key={app} value={app}>{app}</MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter policy description..."
            required
          />
          <TextField
            label="Effective Date"
            type="date"
            fullWidth
            value={formData.effectiveDate}
            onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }}>
            Rule Definition
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Percentage"
              type="number"
              fullWidth
              value={formData.ruleDefinition.percentage}
              onChange={(e) => setFormData({
                ...formData,
                ruleDefinition: {
                  ...formData.ruleDefinition,
                  percentage: Math.max(0, Number(e.target.value)),
                },
              })}
              InputProps={{
                endAdornment: <Typography color="text.secondary" sx={{ ml: 1 }}>%</Typography>,
              }}
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              label="Fixed Amount"
              type="number"
              fullWidth
              value={formData.ruleDefinition.fixedAmount}
              onChange={(e) => setFormData({
                ...formData,
                ruleDefinition: {
                  ...formData.ruleDefinition,
                  fixedAmount: Math.max(0, Number(e.target.value)),
                },
              })}
              InputProps={{
                startAdornment: <Typography color="text.secondary" sx={{ mr: 1 }}>$</Typography>,
              }}
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Threshold Amount"
              type="number"
              fullWidth
              value={formData.ruleDefinition.thresholdAmount}
              onChange={(e) => setFormData({
                ...formData,
                ruleDefinition: {
                  ...formData.ruleDefinition,
                  thresholdAmount: Number(e.target.value),
                },
              })}
              InputProps={{
                startAdornment: <Typography color="text.secondary" sx={{ mr: 1 }}>$</Typography>,
              }}
            />
          </Stack>
        </Stack>
      </ConfigDialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingItem(null);
        }}
        onConfirm={handleDelete}
        itemName={deletingItem?.policyName}
        loading={saving}
      />

    </Box>
  );
}
