import { db } from './firestore'
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import { getWeeklyDocId } from './firestore.utils'
import type { FoodItemProps } from '@/firebase/menuManagement'

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
  const historyItem: InventoryHistoryItem = {
    foodId: updatedItem.foodId,
    name: updatedItem.name,
    currentStockCount: updatedItem.currentStockCount,
    lastStockCount: updatedItem.lastStockCount,
    reasonForStockEdit: updatedItem.reasonForStockEdit,
    dateModified: updatedItem.dateModified,
    editedStockBy: updatedItem.editedStockBy,
  }
  await saveInventoryHistory({
    historyId: crypto.randomUUID(),
    foodItems: [historyItem],
  })
  return updatedItem
}

export type InventoryHistoryItem = Omit<
  FoodItemProps,
  'price' | 'type' | 'mainCategory' | 'photoURL' | 'addedBy'
>

export type InventoryHistoryProps = {
  historyId: string // document ID
  foodItems: InventoryHistoryItem[]
}

// Save inventory history for audit trail (batch saves by week)
export async function saveInventoryHistory(
  historyEntry: InventoryHistoryProps,
): Promise<void> {
  // Only save if at least one item's stock actually changed
  const changed = historyEntry.foodItems.some(
    (item) => item.currentStockCount !== item.lastStockCount,
  )
  if (!changed) return

  // Use the first item's dateModified or now for batch doc id
  const docId = getWeeklyDocId(
    new Date(historyEntry.foodItems[0]?.dateModified || Date.now()),
  )
  const batchRef = doc(collection(db, 'inventoryHistoryWeekly'), docId)
  const batchSnap = await getDoc(batchRef)
  let items: InventoryHistoryProps[] = []
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

  console.log('Fetched inventory history entries:', allHistory)

  // Sort by date descending (newest first)
  return allHistory.sort(
    (a, b) =>
      new Date(b.foodItems[0]?.dateModified || '').getTime() -
      new Date(a.foodItems[0]?.dateModified || '').getTime(),
  )
}
