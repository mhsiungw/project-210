import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { HttpError } from '@app/shared/client'

export interface QueryError {
  status: number
  data: string
}

export function toQueryError(e: unknown): QueryError {
  return e instanceof HttpError
    ? { status: e.status, data: e.message }
    : { status: 0, data: String(e) }
}

export const emptyApi = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<QueryError>(),
  tagTypes: ['Book', 'Translation'],
  endpoints: () => ({}),
})
