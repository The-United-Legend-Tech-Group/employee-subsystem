import { useState, useMemo } from 'react';

export interface FilterOptions {
  searchTerm: string;
  startDate: Date | null;
  endDate: Date | null;
}

export function useTableFilters<T>(
  data: T[],
  searchFields: (keyof T)[],
  dateField?: keyof T,
  dateFilterType: 'day' | 'month' | 'year' = 'day'
) {
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    startDate: null,
    endDate: null,
  });

  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter((item) => {
        return searchFields.some((field) => {
          const value = item[field];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchLower);
        });
      });
    }

    // Apply date filter
    if (dateField && (filters.startDate || filters.endDate)) {
      result = result.filter((item) => {
        const dateValue = item[dateField];
        if (!dateValue) return false;

        const itemDate = new Date(String(dateValue));
        if (isNaN(itemDate.getTime())) return false;

        if (dateFilterType === 'month') {
          // Compare by year and month only
          if (filters.startDate) {
            const startYear = filters.startDate.getFullYear();
            const startMonth = filters.startDate.getMonth();
            const itemYear = itemDate.getFullYear();
            const itemMonth = itemDate.getMonth();
            
            if (itemYear < startYear || (itemYear === startYear && itemMonth < startMonth)) {
              return false;
            }
          }
          if (filters.endDate) {
            const endYear = filters.endDate.getFullYear();
            const endMonth = filters.endDate.getMonth();
            const itemYear = itemDate.getFullYear();
            const itemMonth = itemDate.getMonth();
            
            if (itemYear > endYear || (itemYear === endYear && itemMonth > endMonth)) {
              return false;
            }
          }
        } else if (dateFilterType === 'year') {
          // Compare by year only
          if (filters.startDate) {
            const startYear = filters.startDate.getFullYear();
            const itemYear = itemDate.getFullYear();
            if (itemYear < startYear) {
              return false;
            }
          }
          if (filters.endDate) {
            const endYear = filters.endDate.getFullYear();
            const itemYear = itemDate.getFullYear();
            if (itemYear > endYear) {
              return false;
            }
          }
        } else {
          // Default: day-level comparison
          if (filters.startDate && itemDate < filters.startDate) {
            return false;
          }
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); // Include the entire end date
            if (itemDate > endDate) {
              return false;
            }
          }
        }
        return true;
      });
    }

    return result;
  }, [data, filters, searchFields, dateField, dateFilterType]);

  const updateSearch = (searchTerm: string) => {
    setFilters((prev) => ({ ...prev, searchTerm }));
  };

  const updateStartDate = (startDate: Date | null) => {
    setFilters((prev) => ({ ...prev, startDate }));
  };

  const updateEndDate = (endDate: Date | null) => {
    setFilters((prev) => ({ ...prev, endDate }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      startDate: null,
      endDate: null,
    });
  };

  const hasActiveFilters = filters.searchTerm.trim() !== '' || filters.startDate !== null || filters.endDate !== null;

  return {
    filteredData,
    filters,
    updateSearch,
    updateStartDate,
    updateEndDate,
    clearFilters,
    hasActiveFilters,
  };
}
