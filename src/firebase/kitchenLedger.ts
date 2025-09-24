import { memoize } from 'lodash'
import { db } from './firestore'
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import { runTransaction } from 'firebase/firestore'
import { getWeeklyDocId, getWeeklyDocIdsInRange } from './firestore.utils'
export type KitchenLedgerItem = {
  id: string
  itemName: string
  paymentStatus: 'paid' | 'credited'
  price: number
  notes?: string
  vendorId?: string
  addedBy: string
  addedAt: string // ISO date string
  modifiedAt: string // ISO date string
}
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
  const id = crypto.randomUUID()
  const itemToAdd = { ...newItem, id }
  await runTransaction(db, async (transaction) => {
    // All reads first
    const batchDoc = await transaction.get(batchRef)
    const batchItems = batchDoc.exists() ? batchDoc.data().items || [] : []
    let expenseAmount = 0
    let expenseDate = null
    if (newItem.paymentStatus === 'paid') {
      expenseAmount = Number(newItem.price) || 0
      expenseDate = newItem.addedAt.slice(0, 10)
    }
    // Read dailyBalances doc if needed
    let dailyBalancesDocSnap = null
    let dailyBalancesRef = null
    if (expenseAmount > 0 && expenseDate) {
      const year = new Date(expenseDate).getFullYear()
      dailyBalancesRef = doc(db, 'dailyBalances', year.toString())
      dailyBalancesDocSnap = await transaction.get(dailyBalancesRef)
    }
    // All writes after reads
    const updatedItems = [...batchItems, itemToAdd]
    transaction.set(batchRef, { items: updatedItems }, { merge: true })
    if (
      expenseAmount > 0 &&
      expenseDate &&
      dailyBalancesRef &&
      dailyBalancesDocSnap
    ) {
      // Inline the logic from updateDailyBalanceTransaction, but only do writes
      const data = dailyBalancesDocSnap.exists()
        ? dailyBalancesDocSnap.data()
        : null
      const currentDay = data?.dailyAggregates?.[expenseDate]
      const newTotalIncome = currentDay?.totalIncome || 0
      const newTotalExpenses = (currentDay?.totalExpenses || 0) + expenseAmount
      if (dailyBalancesDocSnap.exists()) {
        transaction.update(dailyBalancesRef, {
          [`dailyAggregates.${expenseDate}.totalIncome`]: newTotalIncome,
          [`dailyAggregates.${expenseDate}.totalExpenses`]: newTotalExpenses,
        })
      } else {
        const newBalance = {
          dailyAggregates: {
            [expenseDate]: {
              totalIncome: newTotalIncome,
              totalExpenses: newTotalExpenses,
            },
          },
        }
        transaction.set(dailyBalancesRef, newBalance)
      }
    }
  })
  return itemToAdd
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

// Update a kitchen ledger item's payment status in the correct weekly batch
export async function updateKitchenLedgerItemPaymentStatus(
  itemId: string,
  paymentStatus: 'paid' | 'credited',
) {
  const batchCollection = collection(db, 'kitchenLedgerWeekly')
  const snapshot = await getDocs(batchCollection)
  let batchDocId: string | null = null
  snapshot.forEach((docSnap) => {
    const batchItems = docSnap.data().items || []
    if (batchItems.some((item: any) => item.id === itemId)) {
      batchDocId = docSnap.id
    }
  })
  if (!batchDocId) throw new Error('Item not found in any batch')
  const batchRef = doc(db, 'kitchenLedgerWeekly', batchDocId)
  await runTransaction(db, async (transaction) => {
    // All reads first
    const batchDoc = await transaction.get(batchRef)
    if (!batchDoc.exists()) throw new Error('Batch doc not found')
    const batchItems = batchDoc.data().items || []
    let expenseAmount = 0
    let expenseDate = null
    const updatedItems = batchItems.map((item: any) => {
      if (item.id === itemId) {
        if (item.paymentStatus === 'credited' && paymentStatus === 'paid') {
          expenseAmount = Number(item.price) || 0
          expenseDate = item.addedAt.slice(0, 10)
        }
        return { ...item, paymentStatus, modifiedAt: new Date().toISOString() }
      }
      return item
    })
    // Read dailyBalances doc if needed
    let dailyBalancesDocSnap = null
    let dailyBalancesRef = null
    if (expenseAmount > 0 && expenseDate) {
      const year = new Date(expenseDate).getFullYear()
      dailyBalancesRef = doc(db, 'dailyBalances', year.toString())
      dailyBalancesDocSnap = await transaction.get(dailyBalancesRef)
    }
    // All writes after reads
    transaction.set(batchRef, { items: updatedItems }, { merge: true })
    if (
      expenseAmount > 0 &&
      expenseDate &&
      dailyBalancesRef &&
      dailyBalancesDocSnap
    ) {
      // Inline the logic from updateDailyBalanceTransaction, but only do writes
      const data = dailyBalancesDocSnap.exists()
        ? dailyBalancesDocSnap.data()
        : null
      const currentDay = data?.dailyAggregates?.[expenseDate]
      const newTotalIncome = currentDay?.totalIncome || 0
      const newTotalExpenses = (currentDay?.totalExpenses || 0) + expenseAmount
      if (dailyBalancesDocSnap.exists()) {
        transaction.update(dailyBalancesRef, {
          [`dailyAggregates.${expenseDate}.totalIncome`]: newTotalIncome,
          [`dailyAggregates.${expenseDate}.totalExpenses`]: newTotalExpenses,
        })
      } else {
        const newBalance = {
          dailyAggregates: {
            [expenseDate]: {
              totalIncome: newTotalIncome,
              totalExpenses: newTotalExpenses,
            },
          },
        }
        transaction.set(dailyBalancesRef, newBalance)
      }
    }
  })
  return itemId
}
