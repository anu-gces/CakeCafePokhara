import { useEffect, useState } from 'react'
import {
  onIdTokenChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, enterUserDocument } from '@/firebase/firestore'
import type { UserAdditional } from '@/firebase/firestore'
import { auth } from '@/firebase/firebase'

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userAdditional, setUserAdditional] = useState<UserAdditional | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Listen to Firebase Auth changes
  useEffect(() => {
    const handleAuth = async (firebaseUser: User | null) => {
      setLoading(true)
      setError(null)
      try {
        setUser(firebaseUser)
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid)
          const userDoc = await getDoc(userRef)
          if (userDoc.exists()) {
            setUserAdditional(userDoc.data() as UserAdditional)
          } else {
            const newUser: UserAdditional = {
              uid: firebaseUser.uid,
              email: firebaseUser.email ?? '',
              photoURL: firebaseUser.photoURL ?? null,
              firstName: '',
              lastName: '',
              phoneNumber: '',
              department: '',
              role: 'employee',
              isProfileComplete: false,
            }
            await setDoc(userRef, newUser)
            setUserAdditional(newUser)
          }
        } else {
          setUserAdditional(null)
        }
      } catch (err: any) {
        setError(err.message || 'Unknown error')
        setUser(null)
        setUserAdditional(null)
      }
      setLoading(false)
    }
    const unsubscribe = onIdTokenChanged(auth, handleAuth)
    return unsubscribe
  }, [])

  async function isUserProfileComplete(): Promise<boolean> {
    const user = auth.currentUser
    if (user) {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        const userData = userDoc.data()
        return userData ? userData.isProfileComplete : false
      } else {
        await enterUserDocument(user.uid, user.email!, user.photoURL)
        return false
      }
    } else {
      throw new Error('No user is currently logged in')
    }
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      const result = await signInWithPopup(auth, provider)
      if (result.user) {
        setUser(result.user)
      }
      const userRef = doc(db, 'users', result.user.uid)
      const userSnap = await getDoc(userRef)
      let isProfileComplete = false
      if (!userSnap.exists()) {
        await enterUserDocument(
          result.user.uid,
          result.user.email!,
          result.user.photoURL,
        )
      } else {
        isProfileComplete =
          (userSnap.data() as UserAdditional).isProfileComplete ?? false
      }
      return { ...result, isProfileComplete }
    } catch (error) {
      console.error('Error signing in with Google: ', error)
      throw error
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  function getCurrentUser() {
    return auth.currentUser
  }

  return {
    user,
    userAdditional,
    loading,
    error,
    getCurrentUser,
    isUserProfileComplete,
    signInWithGoogle,
    logout,
  }
}

export type FirebaseAuthType = ReturnType<typeof useFirebaseAuth>
