import { db } from './firestore'
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Transaction } from 'firebase/firestore'

export interface DailyBalance {
  dailyAggregates: {
    [date: string]: {
      // YYYY-MM-DD
      totalIncome: number
      totalExpenses: number
    }
  }
}

export interface SeedBalance {
  amount: number
  date: string
}

// Seed balance functions
export const getSeedBalance = async (): Promise<SeedBalance | null> => {
  try {
    const docRef = doc(db, 'seedBalanceConfig', 'seedBalance')
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data() as SeedBalance
      return data
    }
    return null
  } catch (error) {
    console.error('Error getting seed balance:', error)
    throw error
  }
}

export const setSeedBalance = async (
  data: SeedBalance,
): Promise<SeedBalance> => {
  try {
    const docRef = doc(db, 'seedBalanceConfig', 'seedBalance')
    await setDoc(docRef, data)
    return data
  } catch (error) {
    console.error('Error setting seed balance:', error)
    throw error
  }
}

export const deleteSeedBalance = async (): Promise<void> => {
  try {
    const docRef = doc(db, 'seedBalanceConfig', 'seedBalance')
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting seed balance:', error)
    throw error
  }
}

// OPENING AND CLOSING balance update functions

export async function updateDailyBalance(
  date: string,
  income: number = 0,
  expenses: number = 0,
) {
  const year = new Date(date).getFullYear()
  const docRef = doc(db, 'dailyBalances', year.toString())

  try {
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data() as DailyBalance

      // Get current day's data or create new
      const currentDay = data.dailyAggregates[date]

      // Calculate new totals
      const newTotalIncome = (currentDay?.totalIncome || 0) + income
      const newTotalExpenses = (currentDay?.totalExpenses || 0) + expenses

      // Update the daily aggregate
      await updateDoc(docRef, {
        [`dailyAggregates.${date}.totalIncome`]: newTotalIncome,
        [`dailyAggregates.${date}.totalExpenses`]: newTotalExpenses,
      })
    } else {
      // First time - create the document
      const newBalance: DailyBalance = {
        dailyAggregates: {
          [date]: {
            totalIncome: income,
            totalExpenses: expenses,
          },
        },
      }

      await setDoc(docRef, newBalance)
    }
  } catch (error) {
    console.error('Error updating daily balance:', error)
  }
}

export async function updateDailyBalanceTransaction(
  transaction: Transaction,
  date: string,
  income: number = 0,
  expenses: number = 0,
) {
  const year = new Date(date).getFullYear()
  const docRef = doc(db, 'dailyBalances', year.toString())

  // Read the document within the transaction
  const docSnap = await transaction.get(docRef)

  if (docSnap.exists()) {
    const data = docSnap.data() as DailyBalance

    // Get current day's data or create new
    const currentDay = data.dailyAggregates[date]

    // Calculate new totals
    const newTotalIncome = (currentDay?.totalIncome || 0) + income
    const newTotalExpenses = (currentDay?.totalExpenses || 0) + expenses

    // Update the daily aggregate within transaction
    transaction.update(docRef, {
      [`dailyAggregates.${date}.totalIncome`]: newTotalIncome,
      [`dailyAggregates.${date}.totalExpenses`]: newTotalExpenses,
    })
  } else {
    // First time - create the document within transaction
    const newBalance: DailyBalance = {
      dailyAggregates: {
        [date]: {
          totalIncome: income,
          totalExpenses: expenses,
        },
      },
    }

    transaction.set(docRef, newBalance)
  }
}

// Separate functions for clarity
export async function addDailyIncome(date: string, amount: number) {
  await updateDailyBalance(date, amount, 0)
}

export async function addDailyExpense(date: string, amount: number) {
  await updateDailyBalance(date, 0, amount)
}

// Helper function to get all balance data for analytics
export async function getAllBalanceData(): Promise<
  Record<string, DailyBalance>
> {
  try {
    const balanceData: Record<string, DailyBalance> = {}

    // Get all years from 2020 to current year + 1 (to be safe)
    const currentYear = new Date().getFullYear()
    const startYear = 2020
    const endYear = currentYear + 1

    const promises = []
    for (let year = startYear; year <= endYear; year++) {
      const docRef = doc(db, 'dailyBalances', year.toString())
      promises.push(getDoc(docRef))
    }

    const snapshots = await Promise.all(promises)

    snapshots.forEach((docSnap, index) => {
      if (docSnap.exists()) {
        const year = (startYear + index).toString()
        balanceData[year] = docSnap.data() as DailyBalance
      }
    })

    return balanceData
  } catch (error) {
    console.error('Error getting all balance data:', error)
    throw error
  }
}
