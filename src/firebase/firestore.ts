import type { calendarEventProps } from '@/components/calendar_mobile'
// import { FirebaseError } from "firebase/app";
import { type User, onAuthStateChanged } from 'firebase/auth'
import { type User as UserType } from '@/components/employee'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  onSnapshot,
  addDoc,
} from 'firebase/firestore'
import { app, auth } from './firebase'
import { getWeeklyDocId } from './firestore.utils'
import type { CardType as KanbanCardType } from '@/components/ui/kanbanBoard'
import type { PermanentInventoryItem } from '@/routes/home/permanentInventory.lazy'
import type { EquipmentItem } from '@/routes/home/equipment.lazy'

import type { ProcessedOrder } from './takeOrder'

//export const db = getFirestore(app);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: 200000000,
    tabManager: persistentMultipleTabManager(),
  }),
})

// Function to create a new user document
export async function enterUserDocument(
  uid: string,
  email: string,
  photoURL?: string | null,
) {
  const userRef = doc(db, 'users', uid)
  const user = {
    uid,
    email,
    photoURL, // If photoURL is undefined or null, it will be null
    firstName: '',
    lastName: '',
    phoneNumber: '',
    department: '',
    salary: 0, // Default salary
    role: 'employee', // Default role
    isProfileComplete: false, // New field to track if the profile is complete
  }
  await setDoc(userRef, user)
}

export function getCurrentUserDetails(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      unsubscribe()
      resolve(currentUser)
    })
  })
}

export async function getSingleUser(uid: string) {
  const userRef = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)
  if (userSnap.exists()) {
    return userSnap.data() as UserAdditional
  } else {
    return null
  }
}

export async function getAllUsers(): Promise<UserAdditional[]> {
  const usersRef = collection(db, 'users')
  const userSnapshot = await getDocs(usersRef)
  const users = userSnapshot.docs.map((doc) => doc.data())
  // console.log(users);
  return users as UserAdditional[]
}

export async function isUserProfileComplete(): Promise<boolean> {
  const user = auth.currentUser

  if (user) {
    const userRef = doc(db, 'users', user.uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData ? userData.isProfileComplete : false
    } else {
      // Create the user document if it does not exist
      await enterUserDocument(user.uid, user.email!, user.photoURL)
      return false // Profile is not complete yet
    }
  } else {
    throw new Error('No user is currently logged in')
  }
}

export type SalaryLedgerPayment = {
  userUid: string
  amount: number
  date: string
  paidBy: string
  paymentMethod: string
  reference?: string
  notes?: string
}

export async function getSalaryLedgerPayments(
  salaryLedgerUid: string,
): Promise<Array<SalaryLedgerPayment & { id: string }>> {
  const q = query(
    collection(db, 'salaryLedger'),
    where('userUid', '==', salaryLedgerUid),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<SalaryLedgerPayment & { id: string }>
}

export async function enterSalaryLedgerPayment(payment: SalaryLedgerPayment) {
  const paymentsRef = collection(db, 'salaryLedger')
  const docRef = await addDoc(paymentsRef, payment)
  return docRef.id
}

export async function deleteSalaryLedgerPayment(
  paymentId: string,
): Promise<void> {
  const paymentRef = doc(db, 'salaryLedger', paymentId)
  await deleteDoc(paymentRef)
}

export async function completeProfileInformation(
  uid: string,
  profileInfo: {
    firstName: string
    lastName: string
    phoneNumber: string
    department: string
    photoURL: string
  },
) {
  const userRef = doc(db, 'users', uid)

  const updatedUser = {
    ...profileInfo,
    isProfileComplete: true, // Set isProfileComplete to true
  }

  await updateDoc(userRef, updatedUser)
}

export type UserAdditional = {
  uid: string
  email: string
  photoURL: string | null
  firstName: string
  lastName: string
  phoneNumber: string
  department: string
  role: string
  profilePicture?: string | null
  isProfileComplete: boolean
  salary: number // Optional field for salary
}

export async function getCurrentUserDocumentDetails(): Promise<UserAdditional | null> {
  const user = auth.currentUser

  if (user) {
    const userRef = doc(db, 'users', user.uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      // console.log("line 113", userDoc.data); // Log the user data

      return userDoc.data() as UserType
    } else {
      throw new Error('User document does not exist')
    }
  } else {
    throw new Error('No user is currently logged in')
  }
}

export async function editUserDetails(updatedDetails: {
  uid: string // Include uid as part of the updatedDetails object
  firstName?: string
  lastName?: string
  phoneNumber?: string
  department?: string
  salary?: number
  role?: string
}): Promise<void> {
  const currentUser = auth.currentUser

  if ('email' in updatedDetails) {
    throw new Error('Email cannot be updated')
  }

  if (!currentUser) {
    throw new Error('No user is currently logged in')
  }

  // Get the current user's document
  const currentUserRef = doc(db, 'users', currentUser.uid)
  const currentUserDoc = await getDoc(currentUserRef)

  if (!currentUserDoc.exists()) {
    throw new Error('Current user document does not exist')
  }

  const currentUserData = currentUserDoc.data()

  // Check if the current user has the required role
  if (
    currentUserData.role.toLowerCase() !== 'admin' &&
    currentUserData.role.toLowerCase() !== 'owner'
  ) {
    throw new Error('Only admins or owners can edit user details')
  }

  // Extract uid from updatedDetails
  const { uid, ...detailsToUpdate } = updatedDetails

  // Get the target user's document
  const userRef = doc(db, 'users', uid)
  const userDoc = await getDoc(userRef)

  if (!userDoc.exists()) {
    throw new Error('User document does not exist')
  }

  const userData = userDoc.data()

  // Merge the updated details with the existing data
  const updatedUserData = {
    ...userData, // Preserve existing data
    ...detailsToUpdate, // Overwrite with updated details
  }

  try {
    // Update the user document with the merged data
    await updateDoc(userRef, updatedUserData)
  } catch (error) {
    throw new Error('Failed to update user details.')
  }
}

export async function deleteUser(uidToDelete: string): Promise<void> {
  const currentUser = auth.currentUser

  if (!currentUser) {
    throw new Error('No user is currently logged in')
  }

  if (currentUser.uid === uidToDelete) {
    throw new Error('You cannot delete your own account')
  }

  const userRef = doc(db, 'users', uidToDelete)
  const userDoc = await getDoc(userRef)

  if (!userDoc.exists()) {
    throw new Error('User document does not exist')
  }

  const userData = userDoc.data()

  if (
    userData.role.toLowerCase() === 'admin' ||
    userData.role.toLowerCase() === 'owner'
  ) {
    throw new Error('Admin or Owner accounts cannot be deleted')
  }

  try {
    await deleteDoc(userRef)
  } catch (error) {
    throw new Error('Failed to delete user')
  }
}

export async function getKanbanCardDocument() {
  const cardRef = doc(db, 'kanban', 'allItems')
  const cardSnap = await getDoc(cardRef)

  if (cardSnap.exists()) {
    return cardSnap.data().items
  } else {
    return null
  }
}

export async function enterKanbanCardDocument(items: KanbanCardType[]) {
  const user = auth.currentUser

  if (user) {
    const itemsWithMarker = items.map((item) => ({
      ...item,
    })) // Add uid to each item
    const cardRef = doc(db, 'kanban', 'allItems')
    await setDoc(cardRef, { items: itemsWithMarker }, { merge: true }) // Store the items with uid
  }
}

export function listenToKanbanCardDocument(
  callback: (items: KanbanCardType[]) => void,
) {
  const unsub = onSnapshot(doc(db, 'kanban', 'allItems'), (docSnap) => {
    if (docSnap.exists()) {
      const items: KanbanCardType[] = docSnap.data().items || []

      callback(items) // Pass the entire items array back
    } else {
      callback([]) // No data = empty array
    }
  })

  return unsub // Let the component handle cleanup
}

export async function getCalendarEventDocument(): Promise<
  calendarEventProps[]
> {
  const eventsRef = doc(db, 'calendarEvents', 'allEvents')
  const eventsSnap = await getDoc(eventsRef)

  if (eventsSnap.exists()) {
    const data = eventsSnap.data()

    if (data && data.event) {
      data.event = data.event.map(
        (item: calendarEventProps[] & { uid: string }) => {
          const { uid, ...rest } = item // Extract uid and the rest of the properties
          return rest // Return the rest of the properties
        },
      )
    }

    return data.event
  } else {
    return []
  }
}

export async function enterCalendarEvent(event: calendarEventProps[]) {
  const user = auth.currentUser

  if (user) {
    const eventWithUid = event.map((e) => ({ ...e, uid: user.displayName })) // Add uid to each event object
    const eventsRef = doc(db, 'calendarEvents', 'allEvents') // Reference to the 'allEvents' document
    await setDoc(eventsRef, { event: eventWithUid }, { merge: true }) // Store the event under the user's uid
  }
}

export type Creditor = {
  nickname: string
  firstName: string
  lastName: string
  remarks?: string
}

export async function addCreditorToFirestore(creditor: Creditor) {
  const docRef = await addDoc(collection(db, 'creditors'), creditor)
  return docRef.id
}

export async function getAllCreditors(): Promise<
  (Creditor & { id: string })[]
> {
  const creditorsRef = collection(db, 'creditors')
  const querySnapshot = await getDocs(creditorsRef)
  const creditors = querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id, // <-- include Firestore doc ID
        ...doc.data(),
      }) as Creditor & { id: string },
  )
  return creditors
}

export async function getCreditorOrdersByNickname(nickname: string) {
  const dailySnapshots = await getDocs(collection(db, 'orderHistoryDaily'))
  let allOrders: (ProcessedOrder & { docId: string })[] = []
  dailySnapshots.forEach((doc) => {
    const batchOrders = (doc.data().orders || []) as ProcessedOrder[]
    // Attach docId to each order
    const batchOrdersWithDocId = batchOrders.map((order) => ({
      ...order,
      docId: doc.id,
    }))
    allOrders = allOrders.concat(batchOrdersWithDocId)
  })
  // Filter by creditor nickname
  return allOrders.filter((order) => order.creditor === nickname)
}

export async function updateCreditor(
  creditorId: string,
  updatedCreditor: Creditor,
) {
  const creditorRef = doc(db, 'creditors', creditorId)
  try {
    await updateDoc(creditorRef, updatedCreditor)
  } catch (error) {
    throw new Error('Failed to update creditor')
  }
}

export async function deleteCreditor(creditorId: string) {
  const creditorRef = doc(db, 'creditors', creditorId)
  try {
    await deleteDoc(creditorRef)
  } catch (error) {
    throw new Error('Failed to delete creditor')
  }
}

export async function saveUserFcmToken(token: string) {
  const user = auth.currentUser
  if (!user) throw new Error('No user is currently logged in')

  // Reference to a subcollection "fcmTokens" under each user document
  const tokenRef = doc(
    collection(db, 'userFcmTokens', user.uid, 'tokens'),
    token,
  )
  try {
    await setDoc(tokenRef, {
      token,
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    })
  } catch (error) {
    throw new Error('Failed to save FCM token')
  }
}

export async function deleteUserFcmTokenByUid(uid: string, token: string) {
  // Reference to the specific token document in the user's subcollection
  const tokenRef = doc(collection(db, 'userFcmTokens', uid, 'tokens'), token)
  try {
    await deleteDoc(tokenRef)
  } catch (error) {
    throw new Error('Failed to delete FCM token')
  }
}

export async function getKitchenDepartmentFcmTokens(): Promise<
  { uid: string; token: string }[]
> {
  // 1. Query users whose department is 'kitchen'
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('department', '==', 'kitchen'))
  const userSnapshot = await getDocs(q)
  const kitchenUserIds = userSnapshot.docs.map((doc) => doc.id)

  // 2. For each user, get their FCM tokens from the subcollection
  const tokens: { uid: string; token: string }[] = []

  for (const uid of kitchenUserIds) {
    const tokensRef = collection(db, 'userFcmTokens', uid, 'tokens')
    const tokensSnapshot = await getDocs(tokensRef)
    tokensSnapshot.forEach((tokenDoc) => {
      const data = tokenDoc.data()
      if (data.token) tokens.push({ uid, token: data.token })
    })
  }
  return tokens
}

export async function getWaiternDepartmentFcmTokens(): Promise<string[]> {
  // 1. Query users whose department is 'waiter'
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('department', '==', 'waiter'))
  const userSnapshot = await getDocs(q)
  const waiterUserIds = userSnapshot.docs.map((doc) => doc.id)

  // 2. For each user, get their FCM tokens from the subcollection
  const tokens: string[] = []
  for (const uid of waiterUserIds) {
    const tokensRef = collection(db, 'userFcmTokens', uid, 'tokens')
    const tokensSnapshot = await getDocs(tokensRef)
    tokensSnapshot.forEach((tokenDoc) => {
      const data = tokenDoc.data()
      if (data.token) tokens.push(data.token)
    })
  }
  return tokens
}

// Get all permanentInventory items (flattened from all weekly docs)
export async function getAllPermanentInventoryItems(): Promise<
  PermanentInventoryItem[]
> {
  const snapshot = await getDocs(collection(db, 'permanentInventoryWeekly'))
  let allItems: PermanentInventoryItem[] = []
  snapshot.forEach((doc) => {
    const batchItems = (doc.data().items || []) as PermanentInventoryItem[]
    allItems = allItems.concat(batchItems)
  })
  // Sort by lastUpdated descending (latest first)
  allItems.sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  )
  return allItems
}

// Add an permanentInventory item to the correct weekly batch
export async function addPermanentInventoryItem(
  newItem: Omit<PermanentInventoryItem, 'id'>,
) {
  const docId = getWeeklyDocId(new Date(newItem.lastUpdated))
  const batchRef = doc(collection(db, 'permanentInventoryWeekly'), docId)
  const batchSnap = await getDoc(batchRef)
  let items: PermanentInventoryItem[] = []
  if (batchSnap.exists()) {
    items = batchSnap.data().items || []
  }
  // Generate a unique id for the item
  const id = crypto.randomUUID()
  items.push({ ...newItem, id })
  await setDoc(batchRef, { items }, { merge: true })
  return { ...newItem, id }
}

// Edit an permanentInventory item in the correct weekly batch
export async function editPermanentInventoryItem(
  updatedItem: PermanentInventoryItem,
) {
  // Find the batch doc by lastUpdated date
  const docId = getWeeklyDocId(new Date(updatedItem.lastUpdated))
  const batchRef = doc(collection(db, 'permanentInventoryWeekly'), docId)
  const batchSnap = await getDoc(batchRef)
  if (!batchSnap.exists()) throw new Error('Batch document not found')

  let items: PermanentInventoryItem[] = batchSnap.data().items || []
  const idx = items.findIndex((item: any) => item.id === updatedItem.id)
  if (idx === -1) throw new Error('Item not found in batch')

  items[idx] = { ...updatedItem }
  await setDoc(batchRef, { items }, { merge: true })
  return updatedItem
}

// Delete an permanentInventory item from the correct weekly batch
export async function deletePermanentInventoryItem(itemId: string) {
  const snapshot = await getDocs(collection(db, 'permanentInventoryWeekly'))
  let batchDocId: string | null = null
  let items: PermanentInventoryItem[] = []
  snapshot.forEach((doc) => {
    const batchItems = doc.data().items || []
    if (batchItems.some((item: any) => item.id === itemId)) {
      batchDocId = doc.id
      items = batchItems
    }
  })
  if (!batchDocId) throw new Error('Item not found in any batch')
  const newItems = items.filter((item: any) => item.id !== itemId)
  await setDoc(
    doc(db, 'permanentInventoryWeekly', batchDocId),
    { items: newItems },
    { merge: true },
  )
  return itemId
}

// Get all equipment items (flattened from all weekly docs)
export async function getAllEquipmentItems(): Promise<EquipmentItem[]> {
  const snapshot = await getDocs(collection(db, 'equipmentWeekly'))
  let allItems: EquipmentItem[] = []
  snapshot.forEach((doc) => {
    const batchItems = (doc.data().items || []) as EquipmentItem[]
    allItems = allItems.concat(batchItems)
  })
  // Sort by lastUpdated descending (latest first)
  allItems.sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  )
  return allItems
}

// Add an equipment item to the correct weekly batch
export async function addEquipmentItem(newItem: Omit<EquipmentItem, 'id'>) {
  const docId = getWeeklyDocId(new Date(newItem.lastUpdated))
  const batchRef = doc(collection(db, 'equipmentWeekly'), docId)
  const batchSnap = await getDoc(batchRef)
  let items: EquipmentItem[] = []
  if (batchSnap.exists()) {
    items = batchSnap.data().items || []
  }
  // Generate a unique id for the item
  const id = crypto.randomUUID()
  items.push({ ...newItem, id })
  await setDoc(batchRef, { items }, { merge: true })
  return { ...newItem, id }
}

// Edit an equipment item in the correct weekly batch
export async function editEquipmentItem(updatedItem: EquipmentItem) {
  // Find the batch doc by lastUpdated date
  const docId = getWeeklyDocId(new Date(updatedItem.lastUpdated))
  const batchRef = doc(collection(db, 'equipmentWeekly'), docId)
  const batchSnap = await getDoc(batchRef)
  if (!batchSnap.exists()) throw new Error('Batch document not found')

  let items: EquipmentItem[] = batchSnap.data().items || []
  const idx = items.findIndex((item: any) => item.id === updatedItem.id)
  if (idx === -1) throw new Error('Item not found in batch')

  items[idx] = { ...updatedItem }
  await setDoc(batchRef, { items }, { merge: true })
  return updatedItem
}

// Delete an equipment item from the correct weekly batch
export async function deleteEquipmentItem(itemId: string) {
  const snapshot = await getDocs(collection(db, 'equipmentWeekly'))
  let batchDocId: string | null = null
  let items: EquipmentItem[] = []
  snapshot.forEach((doc) => {
    const batchItems = doc.data().items || []
    if (batchItems.some((item: any) => item.id === itemId)) {
      batchDocId = doc.id
      items = batchItems
    }
  })
  if (!batchDocId) throw new Error('Item not found in any batch')
  const newItems = items.filter((item: any) => item.id !== itemId)
  await setDoc(
    doc(db, 'equipmentWeekly', batchDocId),
    { items: newItems },
    { merge: true },
  )
  return itemId
}
