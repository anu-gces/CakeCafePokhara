import { db } from './firestore'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth } from './firebase'
import { deleteMenuItemImage } from './firebase_storage'

export type FoodItemProps = {
  foodId: string // unique identifier
  name: string // e.g., "Chicken Pizza"
  price: number // item price
  type: string | null // optional user-defined subgroup, e.g., "Pizza"
  mainCategory:
    | 'appetizers'
    | 'main_courses'
    | 'bakery'
    | 'desserts'
    | 'beverages'
    | 'hard_drinks'
    | 'specials'
    | 'others' // main category
  photoURL: string | null // optional image URL
  currentStockCount?: number // optional stock count
  lastStockCount?: number // optional last stock count
  editedStockBy?: string // optional user who edited stock
  reasonForStockEdit?: 'restock' | 'sale' | 'waste' | 'correction' | 'cancelled' // optional reason for stock edit
  addedBy?: string // optional user who added the item
  dateAdded?: string // optional ISO date string when added
  dateModified?: string // optional ISO date string when last modified
}

export async function getFoodItems(): Promise<FoodItemProps[]> {
  const foodItemsRef = doc(db, 'menu', 'allFoodItems')
  const foodItemsSnap = await getDoc(foodItemsRef)

  if (foodItemsSnap.exists()) {
    const data = foodItemsSnap.data()
    if (data && data.foodItems) {
      console.log('Fetched food items from getFoodItems():', data.foodItems)
      return data.foodItems as FoodItemProps[]
    }
    return []
  } else {
    return []
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
    const foodItemsRef = doc(db, 'menu', 'allFoodItems') // Reference to the 'allFoodItems' document

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
    const foodItemsRef = doc(db, 'menu', 'allFoodItems') // Reference to the 'allFoodItems' document

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

  const foodItemsRef = doc(db, 'menu', 'allFoodItems')

  try {
    const docSnap = await getDoc(foodItemsRef)

    if (!docSnap.exists()) {
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
  } catch (error) {}
}
