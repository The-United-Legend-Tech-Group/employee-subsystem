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
import PaymentIcon from '@mui/icons-material/Payment';
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
  payTypesApi,
  type PayTypeResponse,
  type CreatePayTypeDto,
  type UpdatePayTypeDto,
  type UpdateStatusDto,
} from '../_api/config-setup.api';
import { useConfigPermissions } from '../_utils/config-permissions';

export default function PayTypesPage() {
  const router = useRouter();
  const theme = useTheme();
  const permissions = useConfigPermissions('pay-types');

  const [payTypes, setPayTypes] = React.useState<PayTypeResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<PayTypeResponse | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<PayTypeResponse | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState<CreatePayTypeDto>({
    type: '',
    amount: 0,
  });

  // Pagination & Filter states
  const [page, setPage] = React.useState(0);
  const [limit, setLimit] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('');

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  React.useEffect(() => {
    if (searchParams?.get('status')) {
      setStatusFilter(searchParams.get('status') || '');
    }
  }, []);

  const fetchPayTypes = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await payTypesApi.findAll({
        page: page + 1,
        limit,
        search,
        status: statusFilter as any
      });
      if (response.error) {
        setError(response.error);
        setPayTypes([]);
      } else if (response.data) {
        setPayTypes(response.data.data);
        setTotal(response.data.total);
      }
    } catch (err) {
      setError('Failed to fetch pay types');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  React.useEffect(() => {
    fetchPayTypes();
  }, [fetchPayTypes]);

  // Handle Search Debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchPayTypes();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Status change immediately
  React.useEffect(() => {
    setPage(0);
    fetchPayTypes();
  }, [statusFilter]);

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (item?: PayTypeResponse) => {
    if (item) {
      setEditingItem(item);
      setFormData({ type: item.type, amount: item.amount });
    } else {
      setEditingItem(null);
      setFormData({ type: '', amount: 0 });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({ type: '', amount: 0 });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (editingItem) {
        const updateDto: UpdatePayTypeDto = {
          type: formData.type,
          amount: formData.amount,
        };
        const response = await payTypesApi.update(editingItem._id, updateDto);
        if (response.error) {
          setError(response.error);
          return;
        }
        setSuccess('Pay type updated successfully');
      } else {
        const response = await payTypesApi.create(formData);
        if (response.error) {
          setError(response.error);
          return;
        }
        setSuccess('Pay type created successfully');
      }

      handleCloseDialog();
      fetchPayTypes();
    } catch (err) {
      setError('Failed to save pay type');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      setSaving(true);
      const response = await payTypesApi.delete(deletingItem._id);
      if (response.error) {
        setError(response.error);
        return;
      }
      setSuccess('Pay type deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchPayTypes();
    } catch (err) {
      setError('Failed to delete pay type');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const dto: UpdateStatusDto = { status };
      const response = await payTypesApi.updateStatus(id, dto);
      if (response.error) {
        setError(response.error);
        return;
      }
      setSuccess(`Pay type ${status} successfully`);
      fetchPayTypes();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };


  return (
    <Box sx={{ fontFamily: 'inherit' }}>
      <PageHeader
        title="Pay Types"
        subtitle="Configure different pay types like hourly, monthly, or contract-based payments"
        icon={<PaymentIcon />}
        action={permissions.canCreate ? {
          label: 'Add Pay Type',
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
            placeholder="Search pay types..."
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
          ) : payTypes.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={8}>
              <PaymentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Pay Types Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Add Pay Type" to create your first pay type configuration.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payTypes.map((payType) => (
                      <TableRow key={payType._id} hover>
                        <TableCell>
                          <Typography fontWeight={500}>{payType.type}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography color="primary" fontWeight={600}>
                            {formatCurrency(payType.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={payType.status} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(payType.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {payType.status === 'draft' && permissions.canApprove && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleUpdateStatus(payType._id, 'approved')}
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleUpdateStatus(payType._id, 'rejected')}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {permissions.canEdit && (
                              <Tooltip title={payType.status !== 'draft' ? 'Only draft items can be edited' : 'Edit'}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(payType)}
                                    disabled={payType.status !== 'draft'}
                                    sx={{
                                      color: payType.status !== 'draft' ? 'action.disabled' : 'action.active',
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            {permissions.canDelete && (
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setDeletingItem(payType);
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
        title={editingItem ? 'Edit Pay Type' : 'Add Pay Type'}
        onSubmit={handleSubmit}
        loading={saving}
        icon={<PaymentIcon />}
      >
        <Stack spacing={3}>
          <TextField
            label="Type Name"
            fullWidth
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder="e.g., Hourly, Monthly, Contract"
            required
          />
          <TextField
            label="Amount"
            type="number"
            fullWidth
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            InputProps={{
              startAdornment: <Typography color="text.secondary" sx={{ mr: 1 }}>$</Typography>,
            }}
            required
          />
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
        itemName={deletingItem?.type}
        loading={saving}
      />

    </Box>
  );
}
