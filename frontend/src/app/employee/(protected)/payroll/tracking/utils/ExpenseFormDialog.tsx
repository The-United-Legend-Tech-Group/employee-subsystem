'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme, alpha } from '@mui/material/styles';
import GavelIcon from '@mui/icons-material/Gavel';
import ReceiptIcon from '@mui/icons-material/Receipt';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { formatCurrency } from './index';

export type FormType = 'dispute' | 'claim';

interface ExpenseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { description: string; claimType?: string; amount?: number }) => Promise<void>;
  submitting?: boolean;
  error?: string | null;
  formType: FormType;
  payslipInfo?: {
    payslipId: string;
    payrollPeriod?: string;
    netPay?: number;
  };
  claimTypes?: string[];
}

const MIN_DESCRIPTION_LENGTH = 20;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_AMOUNT = 100000;

export default function ExpenseFormDialog({
  open,
  onClose,
  onSubmit,
  submitting = false,
  error,
  formType,
  payslipInfo,
  claimTypes = ['Travel', 'Meals', 'Medical', 'Office Supplies', 'Other'],
}: ExpenseFormDialogProps) {
  const theme = useTheme();
  const [description, setDescription] = React.useState('');
  const [claimType, setClaimType] = React.useState('');
  const [customClaimType, setCustomClaimType] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState(false);

  const descriptionLength = description.trim().length;
  const isValidDescription = descriptionLength >= MIN_DESCRIPTION_LENGTH && descriptionLength <= MAX_DESCRIPTION_LENGTH;
  const amountNum = amount ? parseFloat(amount) : 0;
  const isValidAmount = !isNaN(amountNum) && amountNum > 0 && amountNum <= MAX_AMOUNT;
  const isValidCustomClaimType = claimType !== 'Other' || (customClaimType.trim().length > 0);
  const isValid = formType === 'dispute' 
    ? isValidDescription 
    : isValidDescription && claimType && isValidAmount && isValidCustomClaimType;
  const showError = touched && !isValid;
  const displayError = error || localError;

  const handleClose = () => {
    if (!submitting) {
      setDescription('');
      setClaimType('');
      setCustomClaimType('');
      setAmount('');
      setTouched(false);
      setLocalError(null);
      onClose();
    }
  };

  const handleSubmit = async () => {
    setTouched(true);
    
    if (!description.trim()) {
      setLocalError(`Please provide a ${formType === 'dispute' ? 'description of the dispute' : 'description of the expense'}`);
      return;
    }

    if (descriptionLength < MIN_DESCRIPTION_LENGTH) {
      setLocalError(`Please provide at least ${MIN_DESCRIPTION_LENGTH} characters for a detailed description`);
      return;
    }

    if (descriptionLength > MAX_DESCRIPTION_LENGTH) {
      setLocalError(`Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`);
      return;
    }

    if (formType === 'claim') {
      if (!claimType) {
        setLocalError('Please select a claim type');
        return;
      }

      if (claimType === 'Other' && !customClaimType.trim()) {
        setLocalError('Please enter a custom claim type');
        return;
      }

      if (!amount || isNaN(amountNum) || amountNum <= 0) {
        setLocalError('Please enter a valid amount greater than 0');
        return;
      }

      if (amountNum > MAX_AMOUNT) {
        setLocalError(`Amount cannot exceed ${formatCurrency(MAX_AMOUNT)}. Please contact HR for larger claims.`);
        return;
      }
    }

    setLocalError(null);
    await onSubmit({
      description: description.trim(),
      ...(formType === 'claim' && {
        claimType: claimType === 'Other' ? customClaimType.trim() : claimType,
        amount: amountNum,
      }),
    });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(value);
      if (localError) {
        setLocalError(null);
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow numbers, decimal point, and empty string
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      if (localError) {
        setLocalError(null);
      }
    }
  };

  const getCharacterCountColor = () => {
    if (descriptionLength === 0) return 'text.secondary';
    if (descriptionLength < MIN_DESCRIPTION_LENGTH) return 'error.main';
    if (descriptionLength > MAX_DESCRIPTION_LENGTH * 0.9) return 'warning.main';
    return 'success.main';
  };

  const getTitle = () => {
    return formType === 'dispute' ? 'Submit Payslip Dispute' : 'Submit New Expense Claim';
  };

  const getSubtitle = () => {
    if (formType === 'dispute' && payslipInfo?.payrollPeriod) {
      return `Payroll Period: ${payslipInfo.payrollPeriod}`;
    }
    if (formType === 'claim') {
      return 'A unique Claim ID will be automatically generated';
    }
    return null;
  };

  const getIcon = () => {
    return formType === 'dispute' ? GavelIcon : ReceiptIcon;
  };

  const getIconColor = () => {
    return formType === 'dispute' ? 'error.main' : 'primary.main';
  };

  const getTips = () => {
    if (formType === 'dispute') {
      return {
        title: 'Before submitting your dispute',
        items: [
          'Be specific about the issue (e.g., incorrect amount, missing payment)',
          'Include relevant details like expected vs. actual amounts',
          'Mention any supporting documents or contract references',
          'Your dispute will be reviewed within 3-5 business days',
        ],
      };
    }
    return {
      title: 'Tips for submitting a claim:',
      items: [
        'Include receipts or supporting documents when available',
        'Be specific about the expense purpose and date',
        'Ensure the amount matches your receipt or invoice',
        'Your claim will be reviewed within 3-5 business days',
      ],
    };
  };

  const getExampleText = () => {
    if (formType === 'dispute') {
      return "My employment contract specifies a base salary of $5,500 per month. However, this payslip shows a base salary of $5,000. Additionally, I worked 10 hours of overtime this month, but no overtime pay is reflected. Please review my timesheet records and correct both discrepancies.";
    }
    return "Business lunch meeting with client on March 15, 2024 at Restaurant XYZ. Total cost: $45.50 including tax and tip. Purpose: Discussing Q2 project requirements and deliverables.";
  };

  const getPlaceholder = () => {
    if (formType === 'dispute') {
      return "Please provide a detailed description of the issue. For example: 'My contract states I should receive $5,500, but this payslip shows $5,000. Please review and correct this discrepancy.'";
    }
    return "Please provide a detailed description of the expense. Include: date of expense, purpose, vendor/merchant name, and any relevant details. For example: 'Business lunch meeting with client on March 15, 2024 at Restaurant XYZ. Total cost: $45.50 including tax and tip.'";
  };

  const IconComponent = getIcon();
  const tips = getTips();
  const exampleText = getExampleText();
  const placeholder = getPlaceholder();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          pt: 3,
          pb: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette[formType === 'dispute' ? 'error' : 'primary'].main, 0.08)} 0%, ${alpha(theme.palette[formType === 'dispute' ? 'error' : 'primary'].main, 0.02)} 100%)`,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(theme.palette[formType === 'dispute' ? 'error' : 'primary'].main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconComponent sx={{ color: getIconColor(), fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" component="span" sx={{ fontWeight: 700, display: 'block' }}>
              {getTitle()}
            </Typography>
            {getSubtitle() && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {getSubtitle()}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 3, pb: 2 }}>
        {/* Info Alert */}
        <Alert
          icon={<InfoIcon />}
          severity="info"
          sx={{
            mb: 3,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.08),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            '& .MuiAlert-icon': {
              color: 'info.main',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {tips.title}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { fontSize: '0.875rem', mb: 0.5, lineHeight: 1.6 } }}>
            {tips.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </Box>
        </Alert>

        {/* Error Alert */}
        {displayError && (
          <Alert
            severity="error"
            onClose={() => {
              setLocalError(null);
            }}
            sx={{
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
          >
            {displayError}
          </Alert>
        )}

        {/* Claim Type Field (only for claims) */}
        {formType === 'claim' && (
          <>
            <FormControl fullWidth required sx={{ mb: 3 }}>
              <InputLabel>Claim Type</InputLabel>
              <Select
                value={claimType}
                onChange={(e) => {
                  setClaimType(e.target.value);
                  if (e.target.value !== 'Other') {
                    setCustomClaimType('');
                  }
                  if (localError) {
                    setLocalError(null);
                  }
                }}
                label="Claim Type"
              >
                {claimTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Select the category that best describes your expense.
              </FormHelperText>
            </FormControl>

            {/* Custom Claim Type Field (shown when "Other" is selected) */}
            {claimType === 'Other' && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  required
                  label="Custom Claim Type"
                  value={customClaimType}
                  onChange={(e) => {
                    setCustomClaimType(e.target.value);
                    if (localError) {
                      setLocalError(null);
                    }
                  }}
                  placeholder="Enter the claim type (e.g., Training, Equipment, etc.)"
                  helperText="Please specify the type of expense"
                  error={touched && claimType === 'Other' && !customClaimType.trim()}
                />
              </Box>
            )}
          </>
        )}

        {/* Amount Field (only for claims) */}
        {formType === 'claim' && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              required
              label="Amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoneyIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              helperText={amount ? `Amount: ${formatCurrency(amountNum || 0)}` : 'Enter the expense amount'}
              error={amount && (!isValidAmount || amountNum > MAX_AMOUNT)}
            />
            {amount && amountNum > MAX_AMOUNT && (
              <FormHelperText error sx={{ mt: 0.5 }}>
                Amount cannot exceed {formatCurrency(MAX_AMOUNT)}. Please contact HR for larger claims.
              </FormHelperText>
            )}
          </Box>
        )}

        {/* Description Field */}
        <Box sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
              }}
            >
              {formType === 'dispute' ? 'Dispute Description' : 'Expense Description'} <Typography component="span" sx={{ color: 'error.main' }}>*</Typography>
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: getCharacterCountColor(),
                fontWeight: 500,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: alpha(
                  theme.palette[descriptionLength < MIN_DESCRIPTION_LENGTH ? 'error' : descriptionLength > MAX_DESCRIPTION_LENGTH * 0.9 ? 'warning' : 'success'].main,
                  0.1
                ),
              }}
            >
              {descriptionLength} / {MAX_DESCRIPTION_LENGTH}
            </Typography>
          </Box>

          <Box
            sx={{
              position: 'relative',
              width: '100%',
            }}
          >
            <textarea
              id={`${formType}-description-textarea`}
              value={description}
              onChange={handleDescriptionChange}
              onBlur={(e) => {
                setTouched(true);
                const textarea = e.target as HTMLTextAreaElement;
                textarea.style.borderColor = showError ? theme.palette.error.main : theme.palette.divider;
                textarea.style.borderWidth = '1px';
                textarea.style.padding = '14px 16px';
              }}
              placeholder={placeholder}
              required
              autoFocus
              rows={10}
              maxLength={MAX_DESCRIPTION_LENGTH}
              style={{
                width: '100%',
                minHeight: '200px',
                maxHeight: '400px',
                padding: '14px 16px',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                fontFamily: 'inherit',
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${showError ? theme.palette.error.main : theme.palette.divider}`,
                borderRadius: '4px',
                resize: 'vertical',
                outline: 'none',
                transition: 'all 0.2s ease-in-out',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                boxSizing: 'border-box',
                margin: 0,
              }}
              onFocus={(e) => {
                const textarea = e.target as HTMLTextAreaElement;
                textarea.style.borderColor = showError ? theme.palette.error.main : theme.palette.primary.main;
                textarea.style.borderWidth = '2px';
                textarea.style.padding = '13px 15px';
              }}
              onMouseEnter={(e) => {
                const textarea = e.target as HTMLTextAreaElement;
                if (document.activeElement !== textarea) {
                  textarea.style.borderColor = showError ? theme.palette.error.main : theme.palette.primary.main;
                }
              }}
              onMouseLeave={(e) => {
                const textarea = e.target as HTMLTextAreaElement;
                if (document.activeElement !== textarea) {
                  textarea.style.borderColor = showError ? theme.palette.error.main : theme.palette.divider;
                }
              }}
            />
          </Box>

          {/* Helper Text */}
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            {descriptionLength > 0 && descriptionLength < MIN_DESCRIPTION_LENGTH && (
              <FormHelperText error sx={{ m: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption">
                  Please provide at least {MIN_DESCRIPTION_LENGTH} characters for a detailed description
                </Typography>
              </FormHelperText>
            )}
            {descriptionLength >= MIN_DESCRIPTION_LENGTH && descriptionLength <= MAX_DESCRIPTION_LENGTH && (
              <FormHelperText sx={{ m: 0, color: 'success.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ color: 'success.main' }}>
                  Description meets minimum requirements
                </Typography>
              </FormHelperText>
            )}
          </Box>
        </Box>

        {/* Example Section */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              borderColor: alpha(theme.palette.primary.main, 0.2),
            },
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <HelpOutlineIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Example Description
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontStyle: 'italic',
              fontSize: '0.875rem',
              lineHeight: 1.7,
              pl: 3,
            }}
          >
            "{exampleText}"
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 2.5,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          gap: 1.5,
        }}
      >
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={submitting}
          sx={{
            minWidth: 100,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'text.primary',
              bgcolor: alpha(theme.palette.common.black, 0.04),
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={formType === 'dispute' ? 'error' : 'primary'}
          disabled={submitting || !isValid || description.trim().length === 0}
          sx={{
            minWidth: 140,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            boxShadow: `0 4px 12px ${alpha(theme.palette[formType === 'dispute' ? 'error' : 'primary'].main, 0.3)}`,
            '&:hover': {
              boxShadow: `0 6px 16px ${alpha(theme.palette[formType === 'dispute' ? 'error' : 'primary'].main, 0.4)}`,
            },
            '&:disabled': {
              boxShadow: 'none',
            },
          }}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <IconComponent />}
        >
          {submitting ? `Submitting...` : formType === 'dispute' ? 'Submit Dispute' : 'Submit Claim'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

