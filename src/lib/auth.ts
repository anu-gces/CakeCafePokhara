import { pb } from './pocketbase'

export const login = async (username: string, pass: string) => {
  const authData = await pb.collection('users').authWithPassword(username, pass)
  return authData
}

export const logout = () => {
  pb.authStore.clear()
}

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

export interface AuthContext {
  pb: typeof pb
  user: User | null // Use your custom interface here
  isAuthenticated: boolean
}

export const getAuthState = (): AuthContext => ({
  pb,
  user: pb.authStore.record as User, // Cast the PB record to your type
  isAuthenticated: pb.authStore.isValid,
})
