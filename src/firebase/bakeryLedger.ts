import { memoize } from 'lodash'
import { db } from './firestore'
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import { getWeeklyDocId, getWeeklyDocIdsInRange } from './firestore.utils'
export type BakeryLedgerItem = {
  id: string
  itemName: string
  paymentStatus: 'paid' | 'credited'
  purchaseDate?: string // ISO date string, optional
  price: number
  notes?: string
  vendorId: string
  addedBy: string
  addedAt: string // ISO date string
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

// Update a bakery ledger item's payment status in the correct weekly batch
export async function updateBakeryLedgerItemPaymentStatus(
  itemId: string,
  paymentStatus: 'paid' | 'credited',
) {
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
  const updatedItems = items.map((item: any) =>
    item.id === itemId ? { ...item, paymentStatus } : item,
  )
  await setDoc(
    doc(db, 'bakeryLedgerWeekly', batchDocId),
    { items: updatedItems },
    { merge: true },
  )
  return itemId
}
