import { db } from './firestore'
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import { getWeeklyDocId } from './firestore.utils'
import { runTransaction } from 'firebase/firestore'
import type { FoodItemProps } from '@/firebase/menuManagement'
import type { AddToCart } from './takeOrder'
import { auth } from './firebase'

// Edit inventory item
export async function editInventoryItem(
  updatedItem: FoodItemProps,
): Promise<FoodItemProps> {
  const inventoryRef = doc(db, 'menu', 'allFoodItems')
  const inventorySnap = await getDoc(inventoryRef)

  let foodItems: FoodItemProps[] = []

  if (inventorySnap.exists()) {
    const data = inventorySnap.data()
    foodItems = data.foodItems || []
  }

  // Find and update the item by id
  const itemIndex = foodItems.findIndex(
    (item) => item.foodId === updatedItem.foodId,
  )

  if (itemIndex === -1) {
    // Item doesn't exist, add it as new
    foodItems.push(updatedItem)
  } else {
    // Item exists, update it
    foodItems[itemIndex] = updatedItem
  }

  // Save inventory data to Firestore
  await setDoc(inventoryRef, { foodItems }, { merge: true })

  // Optionally: Save a history entry if you want an audit trail
  await saveInventoryHistory({ ...updatedItem, historyId: crypto.randomUUID() })
  return updatedItem
}

// Multiple items (transaction-safe for concurrent edits)
export async function editInventoryItems(cart: AddToCart): Promise<AddToCart> {
  const user = auth.currentUser
  if (!user) throw new Error('No user is currently logged in')

  const inventoryRef = doc(db, 'menu', 'allFoodItems')

  const inventorySnap = await getDoc(inventoryRef)

  let foodItems: FoodItemProps[] = []
  if (inventorySnap.exists()) {
    const data = inventorySnap.data()
    foodItems = data.foodItems || []
  }

  for (const cartItem of cart.items) {
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
  }

  setDoc(inventoryRef, { foodItems }, { merge: true })

  return cart
}

// Restore inventory items (e.g. on order cancellation)
export async function restoreInventoryItems(
  cart: AddToCart,
): Promise<AddToCart> {
  const user = auth.currentUser
  if (!user) throw new Error('No user is currently logged in')

  const inventoryRef = doc(db, 'menu', 'allFoodItems')

  await runTransaction(db, async (transaction) => {
    const inventorySnap = await transaction.get(inventoryRef)

    let foodItems: FoodItemProps[] = []
    if (inventorySnap.exists()) {
      const data = inventorySnap.data()
      foodItems = data.foodItems || []
    }

    for (const cartItem of cart.items) {
      const itemIndex = foodItems.findIndex(
        (item) => item.foodId === cartItem.foodId,
      )
      if (itemIndex === -1) continue // skip if not found

      const oldItem = foodItems[itemIndex]
      const newStock = (oldItem.currentStockCount || 0) + cartItem.qty

      const updatedItem: FoodItemProps = {
        ...oldItem,
        lastStockCount: oldItem.currentStockCount,
        currentStockCount: newStock,
        reasonForStockEdit: 'cancelled',
        editedStockBy: user.uid,
        dateModified: new Date().toISOString(),
      }

      foodItems[itemIndex] = updatedItem

      // Save inventory history for audit
      await saveInventoryHistory({
        ...updatedItem,
        historyId: crypto.randomUUID(),
      })
    }

    transaction.set(inventoryRef, { foodItems }, { merge: true })
  })

  return cart
}
export type InventoryHistoryProps = FoodItemProps & {
  historyId: string // document ID
}

// Save inventory history for audit trail (batch saves by week)
export async function saveInventoryHistory(
  historyEntry: InventoryHistoryProps,
): Promise<void> {
  // Only save if stock actually changed
  if (historyEntry.currentStockCount === historyEntry.lastStockCount) return

  const docId = getWeeklyDocId(
    new Date(historyEntry.dateModified || Date.now()),
  )
  const batchRef = doc(collection(db, 'inventoryHistoryWeekly'), docId)
  const batchSnap = await getDoc(batchRef)
  let items: FoodItemProps[] = []
  if (batchSnap.exists()) {
    items = batchSnap.data().items || []
  }
  items.push(historyEntry)
  await setDoc(batchRef, { items }, { merge: true })
}

// Get inventory history for display (from weekly batches)
export async function getAllInventoryHistory(): Promise<
  InventoryHistoryProps[]
> {
  const historySnapshot = await getDocs(
    collection(db, 'inventoryHistoryWeekly'),
  )
  let allHistory: InventoryHistoryProps[] = []

  historySnapshot.forEach((doc) => {
    const batchItems = (doc.data().items || []) as InventoryHistoryProps[]
    allHistory = allHistory.concat(batchItems)
  })

  // Sort by date descending (newest first)
  return allHistory.sort(
    (a, b) =>
      new Date(b.dateModified || '').getTime() -
      new Date(a.dateModified || '').getTime(),
  )
}
