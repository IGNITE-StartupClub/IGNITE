type ResendResult<T> = { data: T | null; error: { message: string } | null }

// The Resend SDK reports API failures in `error` instead of throwing.
export function assertSent<T>(result: ResendResult<T>): T {
  if (result.error) {
    throw new Error(`Resend: ${result.error.message}`)
  }
  return result.data as T
}
