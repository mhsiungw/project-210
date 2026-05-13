import type { AuthResponse } from '@supabase/supabase-js'

export interface BookDto {
  id: string
  fileName: string
  s3Key: string
  s3PreviewKey: string
  s3KeyUrl: string
  s3PreviewKeyUrl: string
  totalPages: number
  currentPage: number
  createdAt?: string
}

export interface TranslationDto {
  id: string
  bookId: string
  text: string
  createdAt?: string
}

export interface AuthDto {
  userId: string
  email: string | null
  accessToken: string
  refreshToken: string
  expiresAt: number | null
}

export function toAuthDto(res: AuthResponse): AuthDto | null {
  const session = res.data?.session
  if (!session) return null
  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
  }
}
