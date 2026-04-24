import { pb } from './pocketbase'

export const login = async (username: string, pass: string) => {
  const authData = await pb.collection('users').authWithPassword(username, pass)
  return authData
}

export const logout = () => {
  pb.authStore.clear()
}
