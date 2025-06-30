import type { calendarEventProps } from '@/components/calendar_mobile'
import type { FoodItemProps } from '@/components/restaurant_mobile/menuManagement'
// import { FirebaseError } from "firebase/app";
import { type User, onAuthStateChanged } from 'firebase/auth'
import { type User as UserType } from '@/components/employee'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  limit,
  orderBy,
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
import { deleteMenuItemImage } from './firebase_storage'
import type { AddToCart } from '@/routes/home/takeOrder'
import {
  generateReceiptId,
  getWeeklyDocId,
  getWeeklyDocIdsInRange,
} from './firestore.utils'
import type { CardType as KanbanCardType } from '@/components/ui/kanbanBoard'
import type { KitchenLedgerItem } from '@/routes/home/kitchenLedger.lazy'
import type { BakeryLedgerItem } from '@/routes/home/bakeryLedger.lazy'
import type { InventoryItem } from '@/routes/home/inventory.lazy'
import type { EquipmentItem } from '@/routes/home/equipment.lazy'
import type { AccessoriesItem } from '@/routes/home/accessories.lazy'

import { memoize } from '@fullcalendar/core/internal'

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
    console.log(`User with UID ${uid} has been updated successfully.`)
  } catch (error) {
    console.error('Error updating user details:', error)
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
    console.log(`User with UID ${uidToDelete} has been deleted`)
  } catch (error) {
    console.error('Error deleting user:', error)
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

export async function getFoodItems(): Promise<FoodItemProps[]> {
  const foodItemsRef = doc(db, 'menu', 'allFoodItemsSubCategory')
  const foodItemsSnap = await getDoc(foodItemsRef)

  if (foodItemsSnap.exists()) {
    const data = foodItemsSnap.data()

    if (data && data.foodItems) {
      data.foodItems = data.foodItems.map(
        (
          item: FoodItemProps & {
            uid: string
            dateAdded: string
            dateModified: string
          },
        ) => {
          const { uid, dateAdded, dateModified, ...rest } = item // Extract uid and the rest of the properties
          return rest // Return the rest of the properties
        },
      )
    }

    return data.foodItems
  } else {
    return [] as FoodItemProps[]
  }
}

export async function enterFoodItem(foodItem: FoodItemProps) {
  const user = auth.currentUser

  if (user) {
    const now = new Date().toISOString()

    const foodItemWithUid = {
      ...foodItem,
      uid: user.uid,
      dateAdded: now,
      dateModified: now,
    } // Add uid to the food item object
    // console.log("food item with uid", foodItemWithUid);
    const foodItemsRef = doc(db, 'menu', 'allFoodItemsSubCategory') // Reference to the 'allFoodItems' document

    // Get the existing data
    const docSnap = await getDoc(foodItemsRef)

    let foodItems = []
    if (docSnap.exists()) {
      foodItems = docSnap.data().foodItems || []
    }

    // Append the new food item
    foodItems.push(foodItemWithUid)

    // Update the document
    try {
      await setDoc(foodItemsRef, { foodItems }, { merge: true })
    } catch (error) {
      throw new Error(`Failed to update document: ${error}`)
    }
  }
}

export async function editFoodItem(foodItem: FoodItemProps) {
  const user = auth.currentUser

  if (user) {
    const now = new Date().toISOString()
    const foodItemWithUid = { ...foodItem, uid: user.uid!, dateModified: now } // Add uid to the food item object
    const foodItemsRef = doc(db, 'menu', 'allFoodItemsSubCategory') // Reference to the 'allFoodItems' document

    // Get the existing data
    const docSnap = await getDoc(foodItemsRef)

    if (!docSnap.exists()) {
      return // End the function if docSnap does not exist
    }

    const foodItems: (FoodItemProps & { uid: string })[] =
      docSnap.data().foodItems || []

    // Find the index of the food item with the matching id
    const index = foodItems.findIndex((item) => item.foodId === foodItem.foodId)

    if (index === -1) {
      return // End the function if foodId does not exist in the document
    }
    foodItems[index] = foodItemWithUid

    // Update the document
    try {
      await setDoc(foodItemsRef, { foodItems }, { merge: true })
    } catch (error) {
      throw new Error(`Failed to update document: ${error}`)
    }
  }
}

export async function deleteFoodItem(foodIdToDelete: string) {
  const user = auth.currentUser

  if (!user) return

  const foodItemsRef = doc(db, 'menu', 'allFoodItemsSubCategory')

  try {
    const docSnap = await getDoc(foodItemsRef)

    if (!docSnap.exists()) {
      console.error('No food items document found.')
      return
    }

    const foodItems: (FoodItemProps & { uid: string })[] =
      docSnap.data().foodItems || []

    // Remove the food item with the given foodId
    const updatedFoodItems = foodItems.filter(
      (item) => item.foodId !== foodIdToDelete,
    )

    // Update Firestore
    await setDoc(foodItemsRef, { foodItems: updatedFoodItems }, { merge: true })

    // Delete associated image
    try {
      await deleteMenuItemImage(foodIdToDelete)
    } catch (error) {
      console.error(
        `Failed to delete menu item image for foodId ${foodIdToDelete}:`,
        error,
      )
    }
  } catch (error) {
    console.error('Failed to delete food item:', error)
  }
}

export async function createOrderDocument(orderDetails: AddToCart) {
  const user = auth.currentUser
  const userDoc = await getCurrentUserDocumentDetails()

  if (!user) throw new Error('No authenticated user found')

  const processedBy =
    userDoc?.firstName || user.displayName || user.email || 'unknown'
  const receiptId = generateReceiptId()
  const receiptDate = new Date().toISOString()

  const orderData = {
    ...orderDetails,
    processedBy,
    receiptId,
    receiptDate,
    updatedAt: receiptDate,
  }

  // Use weekly batching
  const docId = getWeeklyDocId()
  const batchRef = doc(collection(db, 'orderHistoryWeekly'), docId)

  // Get current batch
  const batchSnap = await getDoc(batchRef)
  let orders: any[] = []
  if (batchSnap.exists()) {
    orders = batchSnap.data().orders || []
  }
  console.log('Order data before push:', JSON.stringify(orderData, null, 2)) // <-- Add this line

  // Add new order

  orders.push(orderData)

  // Save back to Firestore
  // Save back to Firestore
  try {
    await setDoc(batchRef, { orders }, { merge: true })
  } catch (err) {
    console.error('FIRESTORE ERROR on setDoc:', err)
    // Optionally, log the problematic data for easier debugging:
    console.error('Problematic orderData:', JSON.stringify(orderData, null, 2))
    throw err // rethrow if you want the error to propagate
  }
}

export interface ProcessedOrder extends AddToCart {
  processedBy: string
  receiptDate: string
  updatedAt: string
  receiptId: string
}

export async function getAllOrders(): Promise<ProcessedOrder[]> {
  const ordersRef = collection(db, 'orderHistoryWeekly')
  const querySnapshot = await getDocs(ordersRef)
  let allOrders: ProcessedOrder[] = []
  querySnapshot.forEach((doc) => {
    const batchOrders = (doc.data().orders || []) as ProcessedOrder[]
    allOrders = allOrders.concat(batchOrders)
  })
  // Sort by receiptDate descending
  allOrders.sort(
    (a, b) =>
      new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime(),
  )
  return allOrders
}

// export function listenToAllOrders(
//   callback: (orders: (ProcessedOrder & { docId: string })[]) => void,
// ) {
//   // Only fetch orders where status is NOT 'cancelled'
//   const ordersRef = collection(db, 'orderHistory')
//   const q = query(
//     ordersRef,
//     where('status', 'not-in', ['cancelled', 'dismissed']),
//     orderBy('receiptDate', 'desc'),
//   )

//   const unsubscribe = onSnapshot(
//     q,
//     (querySnapshot) => {
//       const orders = querySnapshot.docs.map((doc) => ({
//         ...(doc.data() as ProcessedOrder),
//         docId: doc.id, // Attach Firestore document ID
//       }))
//       callback(orders)
//     },
//     (error) => {
//       console.error('Error listening to orders:', error)
//     },
//   )

//   return unsubscribe
// }

export function listenToAllOrders(
  callback: (orders: (ProcessedOrder & { docId: string })[]) => void,
) {
  const ordersRef = collection(db, 'orderHistoryWeekly')

  const unsubscribe = onSnapshot(
    ordersRef,
    (querySnapshot) => {
      let allOrders: (ProcessedOrder & { docId: string })[] = []
      querySnapshot.forEach((doc) => {
        const batchOrders = (doc.data().orders || []).map(
          (order: ProcessedOrder) => ({
            ...order,
            docId: doc.id, // Attach batch doc ID
          }),
        )
        allOrders = allOrders.concat(batchOrders)
      })

      // Filter out cancelled/dismissed
      allOrders = allOrders.filter(
        (order) => order.status !== 'cancelled' && order.dismissed !== true,
      )

      // Sort by receiptDate descending
      allOrders.sort(
        (a, b) =>
          new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime(),
      )

      callback(allOrders)
    },
    (error) => {
      console.error('Error listening to orders:', error)
    },
  )

  return unsubscribe
}

// export async function updateOrderStatus(docId: string, status: string) {
//   const orderRef = doc(db, 'orderHistory', docId)
//   await updateDoc(orderRef, { status })
// }

export async function updateOrderStatus(
  batchDocId: string,
  status: string,
  receiptId: string,
) {
  const batchRef = doc(db, 'orderHistoryWeekly', batchDocId)
  const batchSnap = await getDoc(batchRef)
  if (!batchSnap.exists()) throw new Error('Batch document not found')

  const orders = batchSnap.data().orders || []

  const idx = orders.findIndex((o: any) => o.receiptId === receiptId)
  if (idx === -1) throw new Error('Order not found in batch')

  orders[idx].status = status
  orders[idx].updatedAt = new Date().toISOString()

  await setDoc(batchRef, { orders }, { merge: true })
}

export async function dismissOrderNotification(
  batchDocId: string,
  receiptId: string,
) {
  const batchRef = doc(db, 'orderHistoryWeekly', batchDocId)
  const batchSnap = await getDoc(batchRef)
  if (!batchSnap.exists()) throw new Error('Batch document not found')

  const orders = batchSnap.data().orders || []

  const idx = orders.findIndex((o: any) => o.receiptId === receiptId)
  if (idx === -1) throw new Error('Order not found in batch')

  orders[idx].dismissed = true
  orders[idx].updatedAt = new Date().toISOString()

  await setDoc(batchRef, { orders }, { merge: true })
}

// export async function deleteOrder(docId: string) {
//   const orderRef = doc(db, 'orderHistory', docId)
//   await deleteDoc(orderRef)
// }

export async function deleteOrder(batchDocId: string, receiptId: string) {
  const batchRef = doc(db, 'orderHistoryWeekly', batchDocId)
  const batchSnap = await getDoc(batchRef)
  if (!batchSnap.exists()) throw new Error('Batch document not found')

  let orders = batchSnap.data().orders || []
  orders = orders.filter((o: any) => o.receiptId !== receiptId)
  await setDoc(batchRef, { orders }, { merge: true })
}

export async function getLastNOrders(n: number): Promise<ProcessedOrder[]> {
  const orderHistoryRef = collection(db, 'orderHistory')
  const q = query(orderHistoryRef, orderBy('receiptDate', 'desc'), limit(n))

  try {
    const querySnapshot = await getDocs(q)
    const lastNOrders = querySnapshot.docs.map(
      (doc) =>
        doc.data() as AddToCart & {
          processedBy: string
          receiptDate: string
          receiptId: string
          updatedAt: string
        },
    )

    console.log('Last N Orders:', lastNOrders)
    return lastNOrders
  } catch (error) {
    console.error('Error fetching last N orders:', error)
    throw error
  }
}

// export async function getOrdersInRange(
//   from: string,
//   to: string,
// ): Promise<ProcessedOrder[]> {
//   const ordersCollection = collection(db, 'orderHistory')
//   const startDate = new Date(from).toISOString()
//   const endDate = new Date(
//     new Date(to).setDate(new Date(to).getDate() + 1),
//   ).toISOString()

//   const q = query(
//     ordersCollection,
//     where('receiptDate', '>=', startDate),
//     where('receiptDate', '<', endDate),
//   )

//   try {
//     const querySnapshot = await getDocs(q)
//     const orders = querySnapshot.docs.map(
//       (doc) =>
//         doc.data() as AddToCart & {
//           processedBy: string
//           receiptDate: string
//           receiptId: string
//         },
//     )

//     console.log('Orders in range:', orders)
//     return orders
//   } catch (error) {
//     console.error('Error fetching orders in range:', error)
//     throw error
//   }
// }

// export async function getOrdersInRange(
//   from: string,
//   to: string,
// ): Promise<ProcessedOrder[]> {
//   const ordersRef = collection(db, 'orderHistoryWeekly')
//   const querySnapshot = await getDocs(ordersRef)
//   let allOrders: ProcessedOrder[] = []
//   querySnapshot.forEach((doc) => {
//     const batchOrders = (doc.data().orders || []) as ProcessedOrder[]
//     allOrders = allOrders.concat(batchOrders)
//   })

//   const startDate = new Date(from)
//   // Add 1 day to include the end date fully
//   const endDate = new Date(to)
//   endDate.setDate(endDate.getDate() + 1)

//   const filteredOrders = allOrders.filter((order) => {
//     const orderDate = new Date(order.receiptDate)
//     return orderDate >= startDate && orderDate < endDate
//   })

//   // Sort by receiptDate descending
//   filteredOrders.sort(
//     (a, b) =>
//       new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime(),
//   )

//   return filteredOrders
// }

// export async function getOrdersInRange(
//   from: string,
//   to: string,
// ): Promise<ProcessedOrder[]> {
//   // Generate all weekly doc IDs within the range
//   const weekIds = getWeeklyDocIdsInRange(from, to) // returns array of strings like ['2024-05-Week01', ...]

//   // Fetch all weekly docs in parallel by those IDs
//   const docs = await Promise.all(
//     weekIds.map((weekId) =>
//       getDoc(doc(db, 'orderHistoryWeekly', weekId)).then((snap) => snap.data()),
//     ),
//   )

//   // Flatten all orders from the fetched docs
//   const allOrders: ProcessedOrder[] = docs.flatMap(
//     (doc) => (doc?.orders || []) as ProcessedOrder[],
//   )

//   // Filter orders strictly by date range
//   const startDate = new Date(from)
//   const endDate = new Date(to)
//   endDate.setDate(endDate.getDate() + 1) // make end inclusive

//   return allOrders
//     .filter((order) => {
//       const orderDate = new Date(order.receiptDate)
//       return orderDate >= startDate && orderDate < endDate
//     })
//     .sort(
//       (a, b) =>
//         new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime(),
//     )
// }

const memoizedFetchOrderWeeklyDoc = memoize(async (weekId: string) => {
  const snap = await getDoc(doc(db, 'orderHistoryWeekly', weekId))
  return snap.data()
})

export async function getOrdersInRange(
  from: string,
  to: string,
): Promise<ProcessedOrder[]> {
  const weekIds = getWeeklyDocIdsInRange(from, to)

  const docs = await Promise.all(
    weekIds.map((weekId) => memoizedFetchOrderWeeklyDoc(weekId)),
  )

  // rest of your existing code unchanged
  const allOrders: ProcessedOrder[] = docs.flatMap(
    (doc) => (doc?.orders || []) as ProcessedOrder[],
  )

  const startDate = new Date(from)
  const endDate = new Date(to)
  endDate.setDate(endDate.getDate() + 1)

  return allOrders
    .filter((order) => {
      const orderDate = new Date(order.receiptDate)
      return orderDate >= startDate && orderDate < endDate
    })
    .sort(
      (a, b) =>
        new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime(),
    )
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
  const weeklySnapshots = await getDocs(collection(db, 'orderHistoryWeekly'))
  let allOrders: (ProcessedOrder & { docId: string })[] = []
  weeklySnapshots.forEach((doc) => {
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

// Get all kitchen ledger items (flattened from all weekly docs)
export async function getAllKitchenLedgerItems(): Promise<KitchenLedgerItem[]> {
  const snapshot = await getDocs(collection(db, 'kitchenLedgerWeekly'))
  let allItems: KitchenLedgerItem[] = []
  snapshot.forEach((doc) => {
    const batchItems = (doc.data().items || []) as KitchenLedgerItem[]
    allItems = allItems.concat(batchItems)
  })
  // Sort by addedAt descending (latest first)
  allItems.sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
  )
  return allItems
}

const memoizedFetchKitchenWeeklyLedgerDoc = memoize(async (weekId: string) => {
  const snap = await getDoc(doc(db, 'kitchenLedgerWeekly', weekId))
  return snap.data()
})

export async function getKitchenLedgerInRange(
  from: string,
  to: string,
): Promise<KitchenLedgerItem[]> {
  const weekIds = getWeeklyDocIdsInRange(from, to)

  const docs = await Promise.all(
    weekIds.map((weekId) => memoizedFetchKitchenWeeklyLedgerDoc(weekId)),
  )

  const allItems: KitchenLedgerItem[] = docs.flatMap(
    (doc) => (doc?.items || []) as KitchenLedgerItem[],
  )

  const startDate = new Date(from)
  const endDate = new Date(to)
  endDate.setDate(endDate.getDate() + 1)

  return allItems
    .filter((item) => {
      const itemDate = new Date(item.addedAt)
      return itemDate >= startDate && itemDate < endDate
    })
    .sort(
      (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
    )
}

// Add a kitchen ledger item to the correct weekly batch
export async function addKitchenLedgerItem(
  newItem: Omit<KitchenLedgerItem, 'id'>,
) {
  const docId = getWeeklyDocId(new Date(newItem.addedAt))
  const batchRef = doc(collection(db, 'kitchenLedgerWeekly'), docId)
  const batchSnap = await getDoc(batchRef)
  let items: KitchenLedgerItem[] = []
  if (batchSnap.exists()) {
    items = batchSnap.data().items || []
  }
  // Generate a unique id for the item
  const id = crypto.randomUUID()
  items.push({ ...newItem, id })
  await setDoc(batchRef, { items }, { merge: true })
  return { ...newItem, id }
}

// Delete a kitchen ledger item from the correct weekly batch
export async function deleteKitchenLedgerItem(itemId: string) {
  const snapshot = await getDocs(collection(db, 'kitchenLedgerWeekly'))
  let batchDocId: string | null = null
  let items: KitchenLedgerItem[] = []
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
    doc(db, 'kitchenLedgerWeekly', batchDocId),
    { items: newItems },
    { merge: true },
  )
  return itemId
}

export async function getAllBakeryLedgerItems(): Promise<BakeryLedgerItem[]> {
  const snapshot = await getDocs(collection(db, 'bakeryLedgerWeekly'))
  let allItems: BakeryLedgerItem[] = []
  snapshot.forEach((doc) => {
    const batchItems = (doc.data().items || []) as BakeryLedgerItem[]
    allItems = allItems.concat(batchItems)
  })
  // Sort by addedAt descending (latest first)
  allItems.sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
  )
  return allItems
}

const memoizedFetchBakeryWeeklyLedgerDoc = memoize(async (weekId: string) => {
  const snap = await getDoc(doc(db, 'bakeryLedgerWeekly', weekId))
  return snap.data()
})

export async function getBakeryLedgerInRange(
  from: string,
  to: string,
): Promise<BakeryLedgerItem[]> {
  const weekIds = getWeeklyDocIdsInRange(from, to)

  const docs = await Promise.all(
    weekIds.map((weekId) => memoizedFetchBakeryWeeklyLedgerDoc(weekId)),
  )

  const allItems: BakeryLedgerItem[] = docs.flatMap(
    (doc) => (doc?.items || []) as BakeryLedgerItem[],
  )

  const startDate = new Date(from)
  const endDate = new Date(to)
  endDate.setDate(endDate.getDate() + 1)

  return allItems
    .filter((item) => {
      const itemDate = new Date(item.addedAt)
      return itemDate >= startDate && itemDate < endDate
    })
    .sort(
      (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
    )
}

// Add a bakery ledger item to the correct weekly batch
export async function addBakeryLedgerItem(
  newItem: Omit<BakeryLedgerItem, 'id'>,
) {
  const docId = getWeeklyDocId(new Date(newItem.addedAt))
  const batchRef = doc(collection(db, 'bakeryLedgerWeekly'), docId)
  const batchSnap = await getDoc(batchRef)
  let items: BakeryLedgerItem[] = []
  if (batchSnap.exists()) {
    items = batchSnap.data().items || []
  }
  // Generate a unique id for the item
  const id = crypto.randomUUID()
  items.push({ ...newItem, id })
  await setDoc(batchRef, { items }, { merge: true })
  return { ...newItem, id }
}

// Delete a bakery ledger item from the correct weekly batch
export async function deleteBakeryLedgerItem(itemId: string) {
  const snapshot = await getDocs(collection(db, 'bakeryLedgerWeekly'))
  let batchDocId: string | null = null
  let items: BakeryLedgerItem[] = []
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
    doc(db, 'bakeryLedgerWeekly', batchDocId),
    { items: newItems },
    { merge: true },
  )
  return itemId
}

// Get all inventory items (flattened from all weekly docs)
export async function getAllInventoryItems(): Promise<InventoryItem[]> {
  const snapshot = await getDocs(collection(db, 'inventoryWeekly'))
  let allItems: InventoryItem[] = []
  snapshot.forEach((doc) => {
    const batchItems = (doc.data().items || []) as InventoryItem[]
    allItems = allItems.concat(batchItems)
  })
  // Sort by lastUpdated descending (latest first)
  allItems.sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  )
  return allItems
}

// Add an inventory item to the correct weekly batch
export async function addInventoryItem(newItem: Omit<InventoryItem, 'id'>) {
  const docId = getWeeklyDocId(new Date(newItem.lastUpdated))
  const batchRef = doc(collection(db, 'inventoryWeekly'), docId)
  const batchSnap = await getDoc(batchRef)
  let items: InventoryItem[] = []
  if (batchSnap.exists()) {
    items = batchSnap.data().items || []
  }
  // Generate a unique id for the item
  const id = crypto.randomUUID()
  items.push({ ...newItem, id })
  await setDoc(batchRef, { items }, { merge: true })
  return { ...newItem, id }
}

// Edit an inventory item in the correct weekly batch
export async function editInventoryItem(updatedItem: InventoryItem) {
  // Find the batch doc by lastUpdated date
  const docId = getWeeklyDocId(new Date(updatedItem.lastUpdated))
  const batchRef = doc(collection(db, 'inventoryWeekly'), docId)
  const batchSnap = await getDoc(batchRef)
  if (!batchSnap.exists()) throw new Error('Batch document not found')

  let items: InventoryItem[] = batchSnap.data().items || []
  const idx = items.findIndex((item: any) => item.id === updatedItem.id)
  if (idx === -1) throw new Error('Item not found in batch')

  items[idx] = { ...updatedItem }
  await setDoc(batchRef, { items }, { merge: true })
  return updatedItem
}

// Delete an inventory item from the correct weekly batch
export async function deleteInventoryItem(itemId: string) {
  const snapshot = await getDocs(collection(db, 'inventoryWeekly'))
  let batchDocId: string | null = null
  let items: InventoryItem[] = []
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
    doc(db, 'inventoryWeekly', batchDocId),
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

// Get all accessories items (flattened from all weekly docs)
export async function getAllAccessoriesItems(): Promise<AccessoriesItem[]> {
  const snapshot = await getDocs(collection(db, 'accessoriesWeekly'))
  let allItems: AccessoriesItem[] = []
  snapshot.forEach((doc) => {
    const batchItems = (doc.data().items || []) as AccessoriesItem[]
    allItems = allItems.concat(batchItems)
  })
  // Sort by lastUpdated descending (latest first)
  allItems.sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  )
  return allItems
}

// Add an accessories item to the correct weekly batch
export async function addAccessoriesItem(newItem: Omit<AccessoriesItem, 'id'>) {
  const docId = getWeeklyDocId(new Date(newItem.lastUpdated))
  const batchRef = doc(collection(db, 'accessoriesWeekly'), docId)
  const batchSnap = await getDoc(batchRef)
  let items: AccessoriesItem[] = []
  if (batchSnap.exists()) {
    items = batchSnap.data().items || []
  }
  // Generate a unique id for the item
  const id = crypto.randomUUID()
  items.push({ ...newItem, id })
  await setDoc(batchRef, { items }, { merge: true })
  return { ...newItem, id }
}

// Edit an accessories item in the correct weekly batch
export async function editAccessoriesItem(updatedItem: AccessoriesItem) {
  // Find the batch doc by lastUpdated date
  const docId = getWeeklyDocId(new Date(updatedItem.lastUpdated))
  const batchRef = doc(collection(db, 'accessoriesWeekly'), docId)
  const batchSnap = await getDoc(batchRef)
  if (!batchSnap.exists()) throw new Error('Batch document not found')

  let items: AccessoriesItem[] = batchSnap.data().items || []
  const idx = items.findIndex((item: any) => item.id === updatedItem.id)
  if (idx === -1) throw new Error('Item not found in batch')

  items[idx] = { ...updatedItem }
  await setDoc(batchRef, { items }, { merge: true })
  return updatedItem
}

// Delete an accessories item from the correct weekly batch
export async function deleteAccessoriesItem(itemId: string) {
  const snapshot = await getDocs(collection(db, 'accessoriesWeekly'))
  let batchDocId: string | null = null
  let items: AccessoriesItem[] = []
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
    doc(db, 'accessoriesWeekly', batchDocId),
    { items: newItems },
    { merge: true },
  )
  return itemId
}
