// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server'
import { authTables } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import { typedV } from 'convex-helpers/validators'

const customUsers = defineTable({
  // Mandatory: Google always provides these
  name: v.string(),
  email: v.string(),
  // Mandatory: We set this manually in our auth hook
  role: v.union(
    v.literal('owner'),
    v.literal('manager'),
    v.literal('employee'),
    v.literal('unverified'),
  ),
  // Optional: These might not exist on signup
  image: v.optional(v.string()),
  department: v.optional(
    v.union(
      v.literal('kitchen'),
      v.literal('waiter'),
      v.literal('operations'),
      v.literal('reception'),
    ),
  ),
  salary: v.optional(v.number()),
  // Convex Auth internal fields (keep these optional as they are mamnaged by the library)
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
}).index('by_email', ['email'])

const salaryLedger = defineTable({
  userId: v.id('users'),
  basePay: v.number(),
  tipsAndBonus: v.number(),
  deductions: v.number(), // Advances taken, broken inventory, or unpaid leave
  paidAt: v.optional(v.number()),
  paidBy: v.id('users'),
  remarks: v.optional(v.string()),
}).index('by_userId_and_date', ['userId', 'paidAt'])

const branches = defineTable({
  name: v.string(),
  address: v.optional(v.string()),
})

const menuItems = defineTable({
  name: v.string(),
  price: v.number(),
  stockCount: v.number(),
  photoId: v.optional(v.id('_storage')),
  type: v.optional(v.string()),
  mainCategory: v.union(
    v.literal('appetizers'),
    v.literal('main_courses'),
    v.literal('bakery'),
    v.literal('desserts'),
    v.literal('beverages'),
    v.literal('hard_drinks'),
    v.literal('specials'),
    v.literal('others'),
  ),
  addedBy: v.id('users'),
  editedBy: v.id('users'),
})

const inventoryHistory = defineTable({
  itemName: v.string(), // Saved directly so history remains valid if the item is deleted
  previousStock: v.number(),
  currentStock: v.number(),
  adjustmentQuantity: v.number(),
  reasonForStockEdit: v.union(
    v.literal('init'),
    v.literal('restock'),
    v.literal('sale'),
    v.literal('waste'),
    v.literal('correction'),
    v.literal('damage'),
  ),
  editedBy: v.id('users'),
})

const payLaterCustomers = defineTable({
  name: v.string(),
  remarks: v.optional(v.string()),
})

const vendors = defineTable({
  name: v.string(),
  remarks: v.optional(v.string()),
})

const orderTickets = defineTable({
  branchId: v.id('branches'),
  payLaterCustomerId: v.optional(v.id('payLaterCustomers')),
  kotNumber: v.string(),
  tableNumber: v.optional(v.number()),
  orderType: v.union(
    v.literal('dine-in'),
    v.literal('takeaway'),
    v.literal('delivery'),
  ),
  totalDiscount: v.number(),
  taxAmount: v.number(),
  deliveryCharge: v.optional(v.number()),
  orderDate: v.number(),
  orderSettledDate: v.optional(v.number()),
  status: v.union(
    v.literal('active'),
    v.literal('paid'),
    v.literal('cancelled'),
    v.literal('refunded'),
    v.literal('payLater'),
  ),
  subTotal: v.number(),
  totalAmount: v.number(),
  paymentMethod: v.union(
    v.literal('cash'),
    v.literal('esewa'),
    v.literal('bank'),
  ),
  addedBy: v.id('users'),
  processedBy: v.id('users'),
  editedBy: v.id('users'),
})
  .index('by_status_and_date', ['status', 'orderDate'])
  .index('by_orderSettledDate', ['orderSettledDate'])
  .index('by_branch_status_and_date', ['branchId', 'status', 'orderDate'])
  .index('by_payLaterCustomerId', ['payLaterCustomerId'])

const orderItems = defineTable({
  itemId: v.id('menuItems'),
  quantity: v.number(),
  notes: v.optional(v.string()),
  isComplimentary: v.boolean(),
  itemStatus: v.union(
    v.literal('cooking'),
    v.literal('cooked'),
    v.literal('served'),
    v.literal('cancelled'), // if customer changes mind
  ),
  orderTicketId: v.id('orderTickets'),
  // snapshot for historical receipts
  name: v.string(),
  price: v.number(),
  addedBy: v.id('users'),
  editedBy: v.id('users'),
}).index('by_orderTicketId', ['orderTicketId'])

const calendarEvents = defineTable({
  title: v.string(),
  startDate: v.number(),
  endDate: v.number(),
  color: v.string(),
})

const expenseLedger = defineTable({
  department: v.union(
    v.literal('kitchen'),
    v.literal('bakery'),
    v.literal('utility'),
    v.literal('barista'),
  ),
  name: v.string(),
  quantity: v.float64(),
  price: v.float64(),
  remarks: v.optional(v.string()),
  status: v.union(v.literal('paid'), v.literal('credited')),
  createdBy: v.id('users'),
  branchId: v.id('branches'),
  vendorId: v.optional(v.id('vendors')),
  date: v.number(),
  settledDate: v.optional(v.number()),
})
  .index('by_department_and_date', ['department', 'date'])
  .index('by_vendorId_and_date', ['vendorId', 'date'])

const assetsLedger = defineTable({
  name: v.string(),
  quantity: v.number(),
  department: v.union(v.literal('permanentInventory'), v.literal('equipments')),
  remarks: v.string(),
  createdBy: v.id('users'),
  date: v.number(),
})

const seedBalance = defineTable({
  branchId: v.id('branches'),
  amount: v.number(),
  date: v.number(),
})

const dailyStats = defineTable({
  branchId: v.id('branches'),
  date: v.number(),
  salesCount: v.number(),
  revenue: v.number(),
  expenses: v.number(),
  paymentBreakdown: v.object({
    cash: v.number(),
    esewa: v.number(),
    bank: v.number(),
  }),
}).index('by_branch_and_date', ['branchId', 'date'])

const schema = defineSchema({
  ...authTables,
  users: customUsers,
  salaryLedger: salaryLedger,
  branches: branches,
  menuItems: menuItems,
  inventoryHistory: inventoryHistory,
  payLaterCustomers: payLaterCustomers,
  vendors: vendors,
  expenseLedger: expenseLedger,
  assetsLedger: assetsLedger,
  orderTickets: orderTickets,
  orderItems: orderItems,
  calendarEvents: calendarEvents,
  seedBalance: seedBalance,
  dailyStats: dailyStats,
})

export const vv = typedV(schema)
export default schema
