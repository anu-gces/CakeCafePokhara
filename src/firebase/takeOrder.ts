import { db, getCurrentUserDocumentDetails } from './firestore'
import { type FoodItemProps } from './menuManagement'
import { auth } from './firebase'
import {
  generateReceiptId,
  getDailyDocId,
  getDailyDocIdsInRange,
} from './firestore.utils'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
} from 'firebase/firestore'
import { memoize } from 'lodash'
import type { InventoryHistoryProps } from './inventoryManagement'

export type AddToCart = {
  kotNumber: string
  items: (FoodItemProps & { qty: number })[] // Added qty property here
  discountAmount: number
  taxAmount: number
  tableNumber: number
  complementary: boolean
  remarks: string
  receiptDate: string // Optional manual date field
  paymentMethod: 'cash' | 'esewa' | 'bank' // Optional payment method field
  deliveryFee?: number // Optional delivery fee field
  creditor?: string | null // Optional creditor field
  status:
    | 'pending'
    | 'ready_to_serve'
    | 'ready_to_pay'
    | 'paid'
    | 'credited'
    | 'cancelled'
    | 'refunded'
  dismissed?: boolean // for notifications
}

// export async function createOrderDocument(orderDetails: AddToCart) {
//   const user = auth.currentUser
//   const userDoc = await getCurrentUserDocumentDetails()

//   if (!user) throw new Error('No authenticated user found')

//   const processedBy =
//     userDoc?.firstName || user.displayName || user.email || 'unknown'
//   const receiptId = generateReceiptId()

//   const receiptDate = orderDetails.receiptDate

//   const orderData = {
//     ...orderDetails,
//     processedBy,
//     receiptId,
//     receiptDate,
//     updatedAt: receiptDate,
//   }

//   // Use weekly batching
//   const docId = getWeeklyDocId(new Date(orderDetails.receiptDate))
//   const batchRef = doc(collection(db, 'orderHistoryDaily'), docId)

//   // Get current batch
//   await runTransaction(db, async (transaction) => {
//     const batchSnap = await transaction.get(batchRef)
//     let orders: AddToCart[] = []
//     if (batchSnap.exists()) {
//       orders = batchSnap.data().orders || []
//     }

//     // Add new order
//     orders.push(orderData)

//     // Save back to Firestore
//     transaction.set(batchRef, { orders }, { merge: true })
//   })
// }

export async function createOrderDocument(orderDetails: AddToCart) {
  const user = auth.currentUser
  const userDoc = await getCurrentUserDocumentDetails()
  if (!user) throw new Error('No authenticated user found')

  const processedBy =
    userDoc?.firstName || user.displayName || user.email || 'unknown'
  const receiptId = generateReceiptId()
  const receiptDate = orderDetails.receiptDate

  const orderData = {
    ...orderDetails,
    processedBy,
    receiptId,
    receiptDate,
    updatedAt: receiptDate,
  }

  // References
  const orderDocId = getDailyDocId(new Date(orderDetails.receiptDate))
  const orderBatchRef = doc(collection(db, 'orderHistoryDaily'), orderDocId)
  const inventoryRef = doc(db, 'menu', 'allFoodItems')
  const inventoryHistoryDocId = getDailyDocId(new Date())
  const inventoryHistoryBatchRef = doc(
    collection(db, 'inventoryHistoryDaily'),
    inventoryHistoryDocId,
  )

  await runTransaction(db, async (transaction) => {
    // --- READS FIRST ---
    const orderBatchSnap = await transaction.get(orderBatchRef)
    let orders: AddToCart[] = []
    if (orderBatchSnap.exists()) {
      orders = orderBatchSnap.data().orders || []
    }

    const inventorySnap = await transaction.get(inventoryRef)
    let foodItems: FoodItemProps[] = []
    if (inventorySnap.exists()) {
      foodItems = inventorySnap.data().foodItems || []
    }

    const inventoryHistorySnap = await transaction.get(inventoryHistoryBatchRef)
    let historyBatches: InventoryHistoryProps[] = []
    if (inventoryHistorySnap.exists()) {
      historyBatches = inventoryHistorySnap.data().items || []
    }

    // --- PROCESS DATA ---
    const batchHistoryItems = []
    for (const cartItem of orderDetails.items) {
      const itemIndex = foodItems.findIndex(
        (item) => item.foodId === cartItem.foodId,
      )
      if (itemIndex === -1) continue // skip if not found

      const oldItem = foodItems[itemIndex]
      const newStock = (oldItem.currentStockCount || 0) - cartItem.qty

      const updatedItem: FoodItemProps = {
        ...oldItem,
        lastStockCount: oldItem.currentStockCount,
        currentStockCount: newStock,
        reasonForStockEdit: 'sale',
        editedStockBy: user.uid,
        dateModified: new Date().toISOString(),
      }

      foodItems[itemIndex] = updatedItem

      // Add to batch history array (Omit fields)
      batchHistoryItems.push({
        foodId: updatedItem.foodId,
        name: updatedItem.name,
        currentStockCount: updatedItem.currentStockCount,
        lastStockCount: updatedItem.lastStockCount,
        reasonForStockEdit: updatedItem.reasonForStockEdit,
        dateModified: updatedItem.dateModified,
        editedStockBy: updatedItem.editedStockBy,
      })
    }

    orders.push(orderData)

    // --- WRITES AFTER ALL READS ---
    transaction.set(orderBatchRef, { orders }, { merge: true })
    transaction.set(inventoryRef, { foodItems }, { merge: true })
    // Save batch inventory history for audit
    if (batchHistoryItems.length > 0) {
      historyBatches.push({
        historyId: crypto.randomUUID(),
        foodItems: batchHistoryItems,
      })
    }
    transaction.set(
      inventoryHistoryBatchRef,
      { items: historyBatches },
      { merge: true },
    )
  })
}

export interface ProcessedOrder extends AddToCart {
  processedBy: string
  updatedAt: string
  receiptId: string
}

export async function getAllOrders(): Promise<ProcessedOrder[]> {
  const ordersRef = collection(db, 'orderHistoryDaily')
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

export async function editOrder(
  originalBatchDocId: string,
  updatedOrder: ProcessedOrder,
) {
  const originalBatchRef = doc(db, 'orderHistoryDaily', originalBatchDocId)
  const originalBatchSnap = await getDoc(originalBatchRef)
  if (!originalBatchSnap.exists()) throw new Error('Original batch not found')

  const originalOrders: ProcessedOrder[] = originalBatchSnap.data().orders || []
  const orderIndex = originalOrders.findIndex(
    (o) => o.receiptId === updatedOrder.receiptId,
  )
  if (orderIndex === -1) throw new Error('Order not found in original batch')

  const oldOrder = originalOrders[orderIndex]
  const oldDate = new Date(oldOrder.receiptDate)
  const newDate = new Date(updatedOrder.receiptDate)

  const oldDocId = getDailyDocId(oldDate)
  const newDocId = getDailyDocId(newDate)

  updatedOrder.updatedAt = new Date().toISOString()

  if (oldDocId === newDocId) {
    // Same week: update in-place
    originalOrders[orderIndex] = { ...oldOrder, ...updatedOrder }
    await setDoc(originalBatchRef, { orders: originalOrders }, { merge: true })
  } else {
    // Remove from old batch
    const updatedOriginalOrders = originalOrders.filter(
      (o) => o.receiptId !== updatedOrder.receiptId,
    )
    await setDoc(
      originalBatchRef,
      { orders: updatedOriginalOrders },
      { merge: true },
    )

    // Add to new batch
    const newBatchRef = doc(db, 'orderHistoryDaily', newDocId)
    const newBatchSnap = await getDoc(newBatchRef)
    let newOrders: ProcessedOrder[] = []

    if (newBatchSnap.exists()) {
      newOrders = newBatchSnap.data().orders || []
    }

    newOrders.push(updatedOrder)
    await setDoc(newBatchRef, { orders: newOrders }, { merge: true })
  }
}

export async function permaDeleteOrder(batchDocId: string, receiptId: string) {
  const batchRef = doc(db, 'orderHistoryDaily', batchDocId)
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
      (doc) => doc.data() as ProcessedOrder,
    )

    return lastNOrders
  } catch (error) {
    throw error
  }
}

export function listenToAllOrders(
  callback: (orders: (ProcessedOrder & { docId: string })[]) => void,
) {
  const ordersRef = collection(db, 'orderHistoryDaily')

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

export async function updateOrderStatus(
  batchDocId: string,
  status: string,
  receiptId: string,
) {
  const batchRef = doc(db, 'orderHistoryDaily', batchDocId)
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
  const batchRef = doc(db, 'orderHistoryDaily', batchDocId)
  const batchSnap = await getDoc(batchRef)
  if (!batchSnap.exists()) throw new Error('Batch document not found')

  const orders = batchSnap.data().orders || []

  const idx = orders.findIndex((o: any) => o.receiptId === receiptId)
  if (idx === -1) throw new Error('Order not found in batch')

  orders[idx].dismissed = true
  orders[idx].updatedAt = new Date().toISOString()

  await setDoc(batchRef, { orders }, { merge: true })
}

const memoizedFetchOrderDailyDoc = memoize(async (dayId: string) => {
  const snap = await getDoc(doc(db, 'orderHistoryDaily', dayId))
  return snap.data()
})

export async function getOrdersInRange(
  from: string,
  to: string,
): Promise<ProcessedOrder[]> {
  const dailyIds = getDailyDocIdsInRange(from, to)

  const docs = await Promise.all(
    dailyIds.map((dailyId) => memoizedFetchOrderDailyDoc(dailyId)),
  )

  const allOrders: ProcessedOrder[] = docs.flatMap(
    (doc) => (doc?.orders || []) as ProcessedOrder[],
  )
  return allOrders
    .filter((order) => {
      const orderDate = new Date(order.receiptDate)
      const orderLocalDateStr = orderDate.toLocaleDateString('en-CA') // "YYYY-MM-DD"
      return orderLocalDateStr >= from && orderLocalDateStr <= to
    })
    .sort(
      (a, b) =>
        new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime(),
    )
}
