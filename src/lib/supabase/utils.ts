/**
 * Utility functions for Supabase operations
 */

/**
 * Normalize Supabase join result - handles both array and object forms
 * Supabase can return joined data as either an array or a single object
 */
export function normalizeJoinResult<T>(data: T | T[] | null): T | null {
  if (data === null || data === undefined) {
    return null
  }
  if (Array.isArray(data)) {
    return data[0] ?? null
  }
  return data
}

/**
 * Normalize Supabase join result with default value
 */
export function normalizeJoinResultWithDefault<T>(data: T | T[] | null, defaultValue: T): T {
  const result = normalizeJoinResult(data)
  return result ?? defaultValue
}
