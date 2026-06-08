import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:8000'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
})

/**
 * Extract a human-readable error message from an axios error.
 * The FastAPI backend returns `{ detail: "..." }` for both business
 * errors and Pydantic validation errors (where detail can be a list).
 */
export function extractError(err) {
  if (err?.response?.data?.detail) {
    const d = err.response.data.detail
    if (typeof d === 'string') return d
    if (Array.isArray(d)) {
      return d
        .map((x) => {
          const loc = Array.isArray(x.loc) ? x.loc.filter((p) => p !== 'body').join('.') : ''
          return loc ? `${loc}: ${x.msg}` : x.msg
        })
        .join('; ')
    }
    return JSON.stringify(d)
  }
  if (err?.message) return err.message
  return 'Unknown error'
}

export const API_BASE_URL = baseURL
