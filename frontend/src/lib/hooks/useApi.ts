'use client';

import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useApi<T = any, P = any>(
  apiFunction: (params: P) => Promise<{ data: T }>,
  options?: UseApiOptions<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (params: P) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiFunction(params);
        setData(response.data);
        options?.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
        const errorObj = new Error(errorMessage);
        setError(errorObj);
        options?.onError?.(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

// Hook specifically for mutations (POST, PUT, PATCH, DELETE)
export function useMutation<T = any, P = any>(
  apiFunction: (params: P) => Promise<{ data: T }>,
  options?: UseApiOptions<T>
) {
  return useApi(apiFunction, options);
}

// Hook for queries (GET)
export function useQuery<T = any, P = any>(
  apiFunction: (params: P) => Promise<{ data: T }>,
  params: P,
  options?: UseApiOptions<T> & { enabled?: boolean }
) {
  const { execute, ...rest } = useApi(apiFunction, options);

  useState(() => {
    if (options?.enabled !== false) {
      execute(params);
    }
  });

  return {
    ...rest,
    refetch: () => execute(params),
  };
}
