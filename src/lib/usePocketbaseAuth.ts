// src/hooks/useAuth.ts
import { pb } from '@/lib/pocketbase'
import { redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export interface User {
  // Base PocketBase System Fields
  id: string
  collectionId: string
  collectionName: 'users'
  created: string // ISO date string
  updated: string // ISO date string

  email: string
  emailVisibility: boolean
  username: string
  verified: boolean

  name: string
  firstName: string
  lastName: string
  avatar: string // Filename for the image
  role: 'owner' | 'manager' | 'employee'
  phoneNumber: number
  salary: number
  department: 'kitchen' | 'waiter' | 'operations' | 'management'
}

export function usePocketbaseAuth() {
  const [user, setUser] = useState<User | null>(
    pb.authStore.record as User | null,
  )
  const navigate = useNavigate()

  useEffect(() => {
    return pb.authStore.onChange((_, model) => {
      setUser(model as User | null)
      if (!model) {
        navigate({ to: '/', replace: true })
      }
    })
  }, [])

  if (!user) throw redirect({ to: '/' })

  return { user, pb }
}
