import { auth } from '@/firebase/firebase'
import { db, enterUserDocument, isUserProfileComplete } from './firestore'

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
} from 'firebase/auth'

export const doCreateUserWithEmailAndPassword = async (
  email: string,
  password: string,
) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password)
  } catch (error) {}
}

export const doSignInWithEmailAndPassword = async (
  email: string,
  password: string,
) => {
  try {
    await signInWithEmailAndPassword(auth, email, password)
  } catch (error) {
    let userFriendlyMessage = ''
    switch ((error as Error).message) {
      case 'Firebase: Error (auth/invalid-email).':
        userFriendlyMessage = 'The email address is not valid.'
        break
      case 'Firebase: Error (auth/invalid-credential).':
        userFriendlyMessage = 'The credentials are invalid.'
        break
      case 'auth/user-not-found':
        userFriendlyMessage = 'No user found with this email.'
        break
      case 'auth/wrong-password':
        userFriendlyMessage = 'The password is incorrect.'
        break
      default:
        userFriendlyMessage = 'An error occurred while signing in.'
    }
    throw { message: userFriendlyMessage } // Throw an object with a message property
  }
}

import { doc, getDoc } from 'firebase/firestore'

export const doSignInWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    prompt: 'select_account',
  })

  try {
    const result = await signInWithPopup(auth, provider)
    const userRef = doc(db, 'users', result.user.uid)
    const userSnap = await getDoc(userRef)

    let isProfileComplete = true
    // If the user document doesn't exist, create a new one
    if (!userSnap.exists()) {
      await enterUserDocument(
        result.user.uid,
        result.user.email!,
        result.user.photoURL,
      )
      isProfileComplete = false
    } else {
      isProfileComplete = await isUserProfileComplete()
    }

    return { ...result, isProfileComplete }
  } catch (error) {
    throw error
  }
}

export const doSignOut = async (): Promise<boolean> => {
  try {
    await signOut(auth)
    return true
  } catch (error) {
    throw error // This will cause the error to be thrown to the caller
  }
}

export const doPasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {}
}

export const doPasswordUpdate = async (password: string) => {
  try {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, password)
    }
  } catch (error) {}
}

export const doDeleteUser = async () => {
  try {
    if (auth.currentUser) {
      await deleteUser(auth.currentUser)
    }
  } catch (error) {}
}

export const doSendEmailVerification = async () => {
  try {
    if (auth.currentUser) {
      const actionCodeSettings = {
        url: window.location.origin + '/home',
        // This must be true.
        handleCodeInApp: true,
      }
      await sendEmailVerification(auth.currentUser, actionCodeSettings)
    }
  } catch (error) {}
}
