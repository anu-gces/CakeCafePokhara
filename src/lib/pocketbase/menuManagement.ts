import { pb } from '@/lib/pocketbase'
// Define the categories as a const to reuse for types or dropdowns
export const MAIN_CATEGORIES = [
  'appetizers',
  'main_courses',
  'bakery',
  'desserts',
  'beverages',
  'hard_drinks',
  'specials',
  'others',
] as const

export type MainCategory = (typeof MAIN_CATEGORIES)[number]

// Extend RecordModel to get id, created, updated, etc
export interface MenuItemProps {
  // default fields
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string
  expand?: { [key: string]: any }
  // custom fields
  name: string
  price: number
  mainCategory: MainCategory
  type?: string
  photoURL?: string
  currentStockCount?: number
  lastStockCount?: number
  editedStockBy?: string // Relation ID
  addedBy?: string // Relation ID
  reasonForStockEdit?: 'restock' | 'sale' | 'waste' | 'correction' | 'cancelled'
}

export const menuItemsQuery = () => ({
  queryKey: ['menuItems'],
  queryFn: () =>
    pb.collection('menuItems').getFullList<MenuItemProps>({
      sort: '-created',
    }),
})
