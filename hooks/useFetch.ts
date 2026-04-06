"use client";

import { useState, useCallback } from "react";

interface UseFetchOptions {
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

export function useFetch<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (
    url: string,
    options?: RequestInit,
    callbacks?: UseFetchOptions
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Terjadi kesalahan");
      }

      setData(result);
      callbacks?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      callbacks?.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute };
}