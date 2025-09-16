import { getDoc, doc } from 'firebase/firestore'
import { db } from './firestore'

// Returns the current inventory snapshot (no history, just current stock for all items)
// Assumes a single Firestore doc (e.g. inventory/current) holds the current inventory state
// Structure: { [foodId]: { currentStock: number, subcategoriesWithStock?: { [subId]: { currentStock: number } } } }

export async function getCurrentInventory() {
  const inventoryDocRef = doc(db, 'inventory', 'current')
  const inventorySnap = await getDoc(inventoryDocRef)
  if (!inventorySnap.exists()) {
    return {}
  }
  return inventorySnap.data() as Record<string, any>
}
