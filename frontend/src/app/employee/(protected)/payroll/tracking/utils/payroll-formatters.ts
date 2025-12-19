/**
 * Payroll Tracking Module - Shared Utility Functions
 * 
 * This file contains common formatting and helper functions used across
 * all payroll tracking pages to avoid code duplication.
 */

// ==================== Currency Formatting ====================

/**
 * Formats a number as USD currency
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
};

// ==================== Date Formatting ====================

/**
 * Formats a date string to a readable format
 * @param dateString - ISO date string
 * @param includeTime - Whether to include time in the output
 * @returns Formatted date string (e.g., "Dec 17, 2024" or "Dec 17, 2024, 10:30 AM")
 */
export const formatDate = (dateString: string | null | undefined, includeTime = false): string => {
  if (!dateString) return 'N/A';
  try {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return new Date(dateString).toLocaleDateString('en-US', options);
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Formats a date string to show only month and year
 * @param dateString - ISO date string
 * @returns Formatted string (e.g., "December 2024")
 */
export const formatMonthYear = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  } catch {
    return 'Invalid Date';
  }
};

// ==================== Status Formatting ====================

/**
 * Returns the MUI color for a given status
 * @param status - The status string
 * @returns MUI color name ('success' | 'warning' | 'error' | 'info' | 'default')
 */
export const getStatusColor = (status: string | null | undefined): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  const statusLower = status?.toLowerCase() || '';
  
  if (statusLower === 'approved' || statusLower === 'paid' || statusLower === 'active') {
    return 'success';
  }
  if (statusLower.includes('review') || statusLower === 'under_review' || statusLower === 'under review') {
    return 'info';
  }
  if (statusLower.includes('pending')) {
    return 'info';
  }
  if (statusLower === 'rejected' || statusLower === 'disputed' || statusLower === 'terminated') {
    return 'error';
  }
  if (statusLower === 'probation' || statusLower === 'processing') {
    return 'info';
  }
  return 'default';
};

/**
 * Formats a status enum value to a readable label
 * @param status - The status string (e.g., "UNDER_REVIEW", "pending_approval")
 * @returns Formatted label (e.g., "Under Review", "Pending Approval")
 */
export const formatStatusLabel = (status: string | null | undefined): string => {
  if (!status) return 'Unknown';
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// ==================== Employee Display ====================

interface EmployeeData {
  _id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  employeeNumber?: string;
}

/**
 * Gets the display name for an employee
 * @param employee - Employee object or string ID
 * @returns Employee name or ID
 */
export const getEmployeeName = (employee: string | EmployeeData | null | undefined): string => {
  if (!employee) return 'N/A';
  if (typeof employee === 'string') return employee;
  if (employee.fullName) return employee.fullName;
  if (employee.firstName || employee.lastName) {
    return `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A';
  }
  return 'N/A';
};

/**
 * Gets the employee number from an employee object
 * @param employee - Employee object or string ID
 * @returns Employee number or 'N/A'
 */
export const getEmployeeNumber = (employee: string | EmployeeData | null | undefined): string => {
  if (!employee) return 'N/A';
  if (typeof employee === 'string') return 'N/A';
  return employee.employeeNumber || 'N/A';
};

/**
 * Gets full employee display (name + number)
 * @param employee - Employee object or string ID
 * @returns Formatted string like "John Doe (EMP001)"
 */
export const getEmployeeDisplay = (employee: string | EmployeeData | null | undefined): string => {
  const name = getEmployeeName(employee);
  const number = getEmployeeNumber(employee);
  if (name === 'N/A') return 'N/A';
  if (number === 'N/A') return name;
  return `${name} (${number})`;
};

// ==================== Contract/Work Type Formatting ====================

/**
 * Formats contract and work type for display
 * @param contractType - Contract type (e.g., "FULL_TIME_CONTRACT")
 * @param workType - Work type (e.g., "FULL_TIME")
 * @returns Formatted string (e.g., "Full Time")
 */
export const formatContractType = (contractType?: string, workType?: string): string => {
  if (!contractType && !workType) return 'N/A';
  
  const contract = contractType?.replace('_CONTRACT', '').replace(/_/g, ' ').toLowerCase() || '';
  const work = workType?.replace(/_/g, ' ').toLowerCase() || '';
  
  const capitalize = (str: string) => 
    str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  // If contract and work are the same, just show one
  if (contract && work && contract.toLowerCase() === work.toLowerCase()) {
    return capitalize(contract);
  }
  
  // If both exist and are different, show both
  if (contract && work) {
    return `${capitalize(contract)} (${capitalize(work)})`;
  }
  
  return capitalize(contract || work) || 'N/A';
};

// ==================== ID Validation ====================

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param id - The ID to validate
 * @returns true if valid ObjectId format
 */
export const isValidObjectId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// ==================== Number Formatting ====================

/**
 * Formats a number with commas for thousands
 * @param num - The number to format
 * @returns Formatted string (e.g., "1,234,567")
 */
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Formats a percentage value
 * @param value - The percentage value (e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places
 * @returns Formatted string (e.g., "15.00%")
 */
export const formatPercentage = (value: number | null | undefined, decimals = 2): string => {
  if (value === null || value === undefined) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
};

