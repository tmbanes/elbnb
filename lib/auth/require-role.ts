// lib/auth/require-role.ts
import { User } from '@/types/user.types'
import { NextResponse } from 'next/server'

export function requireRole(user: User, allowed: string[]) {
  if (!allowed.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}