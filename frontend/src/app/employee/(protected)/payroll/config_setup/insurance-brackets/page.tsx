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
import { useTheme } from '@mui/material/styles';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
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
  insuranceBracketsApi,
  type InsuranceBracketResponse,
  type CreateInsuranceBracketDto,
  type UpdateInsuranceBracketDto,
  type UpdateStatusDto,
} from '../_api/config-setup.api';
import { useConfigPermissions } from '../_utils/config-permissions';

export default function InsuranceBracketsPage() {
  const router = useRouter();
  const theme = useTheme();
  const permissions = useConfigPermissions('insurance-brackets');

  const [brackets, setBrackets] = React.useState<InsuranceBracketResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<InsuranceBracketResponse | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<InsuranceBracketResponse | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState<CreateInsuranceBracketDto>({
    name: '',
    minSalary: 0,
    maxSalary: undefined,
    employeeRate: 0,
    employerRate: 0,
  });

  // Pagination & Filter states
  const [page, setPage] = React.useState(0);
  const [limit, setLimit] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const [minSalaryFilter, setMinSalaryFilter] = React.useState<string>('');
  const [maxSalaryFilter, setMaxSalaryFilter] = React.useState<string>('');

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  React.useEffect(() => {
    if (searchParams?.get('status')) {
      setStatusFilter(searchParams.get('status') || '');
    }
  }, []);

  const fetchBrackets = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await insuranceBracketsApi.findAll({
        page: page + 1,
        limit,
        search,
        status: statusFilter as any,
        minSalary: minSalaryFilter ? Number(minSalaryFilter) : undefined,
        maxSalary: maxSalaryFilter ? Number(maxSalaryFilter) : undefined
      });
      if (response.error) {
        setError(response.error);
        setBrackets([]);
      } else if (response.data) {
        setBrackets(response.data.data);
        setTotal(response.data.total);
      }
    } catch (err) {
      setError('Failed to fetch insurance brackets');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, minSalaryFilter, maxSalaryFilter]);

  React.useEffect(() => {
    fetchBrackets();
  }, [fetchBrackets]);

  // Handle Search Debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchBrackets();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Select & Salary Filters immediately
  React.useEffect(() => {
    setPage(0);
    fetchBrackets();
  }, [statusFilter, minSalaryFilter, maxSalaryFilter]);

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (item?: InsuranceBracketResponse) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        minSalary: item.minSalary,
        maxSalary: item.maxSalary,
        employeeRate: item.employeeRate,
        employerRate: item.employerRate,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        minSalary: 0,
        maxSalary: undefined,
        employeeRate: 0,
        employerRate: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      minSalary: 0,
      maxSalary: undefined,
      employeeRate: 0,
      employerRate: 0,
    });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (editingItem) {
        const updateDto: UpdateInsuranceBracketDto = {
          name: formData.name,
          minSalary: formData.minSalary,
          maxSalary: formData.maxSalary || undefined,
          employeeRate: formData.employeeRate,
          employerRate: formData.employerRate,
        };
        const response = await insuranceBracketsApi.update(editingItem._id, updateDto);
        if (response.error) {
          setError(response.error);
          return;
        }
        setSuccess('Insurance bracket updated successfully');
      } else {
        const response = await insuranceBracketsApi.create(formData);
        if (response.error) {
          setError(response.error);
          return;
        }
        setSuccess('Insurance bracket created successfully');
      }

      handleCloseDialog();
      fetchBrackets();
    } catch (err) {
      setError('Failed to save insurance bracket');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      setSaving(true);
      const response = await insuranceBracketsApi.delete(deletingItem._id);
      if (response.error) {
        setError(response.error);
        return;
      }
      setSuccess('Insurance bracket deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchBrackets();
    } catch (err) {
      setError('Failed to delete insurance bracket');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const dto: UpdateStatusDto = { status };
      const response = await insuranceBracketsApi.updateStatus(id, dto);
      if (response.error) {
        setError(response.error);
        return;
      }
      setSuccess(`Insurance bracket ${status} successfully`);
      fetchBrackets();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value}%`;
  };

  return (
    <Box sx={{ fontFamily: 'inherit' }}>
      <PageHeader
        title="Insurance Brackets"
        subtitle="Configure insurance brackets based on salary ranges with employee and employer rates"
        icon={<AccountBalanceIcon />}
        action={permissions.canCreate ? {
          label: 'Add Bracket',
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
            placeholder="Search insurance brackets..."
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
            size="small"
            type="number"
            label="Min Salary"
            value={minSalaryFilter}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                setMinSalaryFilter('');
                return;
              }
              const num = Number(val);
              setMinSalaryFilter(String(Math.max(0, num)));
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0 }}
            sx={{ width: 140 }}
          />
          <TextField
            size="small"
            type="number"
            label="Max Salary"
            value={maxSalaryFilter}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                setMaxSalaryFilter('');
                return;
              }
              const num = Number(val);
              setMaxSalaryFilter(String(Math.max(0, num)));
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0 }}
            sx={{ width: 140 }}
          />
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
          ) : brackets.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={8}>
              <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Insurance Brackets Found
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Salary Range</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Employee Rate</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Employer Rate</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {brackets.map((bracket) => (
                      <TableRow key={bracket._id} hover>
                        <TableCell>
                          <Typography fontWeight={500}>{bracket.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>
                            {formatCurrency(bracket.minSalary)} - {bracket.maxSalary ? formatCurrency(bracket.maxSalary) : 'No Limit'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography color="primary" fontWeight={600}>
                            {formatPercent(bracket.employeeRate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography color="secondary" fontWeight={600}>
                            {formatPercent(bracket.employerRate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={bracket.status} />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {bracket.status === 'draft' && permissions.canApprove && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleUpdateStatus(bracket._id, 'approved')}
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleUpdateStatus(bracket._id, 'rejected')}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {permissions.canEdit && (
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => handleOpenDialog(bracket)}>
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
                                    setDeletingItem(bracket);
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
        title={editingItem ? 'Edit Insurance Bracket' : 'Add Insurance Bracket'}
        onSubmit={handleSubmit}
        loading={saving}
        icon={<AccountBalanceIcon />}
        maxWidth="sm"
      >
        <Stack spacing={3}>
          <TextField
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Basic Insurance Bracket"
            required
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Min Salary"
              type="number"
              fullWidth
              value={formData.minSalary}
              onChange={(e) => setFormData({ ...formData, minSalary: Math.max(0, Number(e.target.value)) })}
              InputProps={{
                startAdornment: <Typography color="text.secondary" sx={{ mr: 1 }}>$</Typography>,
              }}
              inputProps={{ min: 0 }}
              required
            />
            <TextField
              label="Max Salary (Optional)"
              type="number"
              fullWidth
              value={formData.maxSalary || ''}
              onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value ? Math.max(0, Number(e.target.value)) : undefined })}
              InputProps={{
                startAdornment: <Typography color="text.secondary" sx={{ mr: 1 }}>$</Typography>,
              }}
              inputProps={{ min: 0 }}
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Employee Rate"
              type="number"
              fullWidth
              value={formData.employeeRate}
              onChange={(e) => setFormData({ ...formData, employeeRate: Math.max(0, Number(e.target.value)) })}
              InputProps={{
                endAdornment: <Typography color="text.secondary" sx={{ ml: 1 }}>%</Typography>,
              }}
              inputProps={{ min: 0, max: 100 }}
              required
            />
            <TextField
              label="Employer Rate"
              type="number"
              fullWidth
              value={formData.employerRate}
              onChange={(e) => setFormData({ ...formData, employerRate: Math.max(0, Number(e.target.value)) })}
              InputProps={{
                endAdornment: <Typography color="text.secondary" sx={{ ml: 1 }}>%</Typography>,
              }}
              inputProps={{ min: 0, max: 100 }}
              required
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
        itemName={deletingItem?.name}
        loading={saving}
      />

    </Box>
  );
}
