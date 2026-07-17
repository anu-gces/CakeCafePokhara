import { authenticatedQuery, authenticatedMutation } from '../functions'
import schema from '../schema'
import { vv } from '../schema'

// Helper for picking fields from the expenseLedger table
const ledgerFields = schema.tables.expenseLedger.validator.fields
const DAY_IN_MS = 86_400_000

export const listLedger = authenticatedQuery({
  args: {
    department: ledgerFields.department,
    date: vv.number(),
  },
  minimumRole: 'employee',
  handler: async (ctx, { department, date }) => {
    const ledgers = await ctx.db
      .query('expenseLedger')
      .withIndex('by_department_and_date', (q) =>
        q
          .eq('department', department)
          .gte('date', date)
          .lt('date', date + DAY_IN_MS),
      )
      .collect()

    // Fetch related documents for each ledger
    return await Promise.all(
      ledgers.map(async (ledger) => {
        const [vendor, createdBy] = await Promise.all([
          ledger.vendorId ? ctx.db.get(ledger.vendorId) : null,
          ctx.db.get(ledger.createdBy),
        ])

        return {
          ...ledger,
          vendor,
          createdBy,
        }
      }),
    )
  },
})

export const listLedgerByVendor = authenticatedQuery({
  args: {
    vendorId: vv.id('vendors'),
    date: vv.number(),
  },
  minimumRole: 'employee',
  handler: async (ctx, { vendorId, date }) => {
    const vendor = await ctx.db.get(vendorId)
    // 2. Fetch the ledger entries for that day
    const ledgers = await ctx.db
      .query('expenseLedger')
      .withIndex('by_vendorId_and_date', (q) =>
        q
          .eq('vendorId', vendorId)
          .gte('date', date)
          .lt('date', date + DAY_IN_MS),
      )
      .collect()

    return await Promise.all(
      ledgers.map(async (ledger) => {
        const createdBy = await ctx.db.get(ledger.createdBy)

        return {
          ...ledger,
          vendor,
          createdBy,
        }
      }),
    )
  },
})

export const createLedger = authenticatedMutation({
  args: schema.tables.expenseLedger.validator.omit('createdBy'),
  minimumRole: 'employee',
  handler: async (ctx, args) => {
    return await ctx.db.insert('expenseLedger', {
      ...args,
      createdBy: ctx.user._id,
      settledDate: args.status === 'paid' ? Date.now() : undefined,
    })
  },
})

export const markAsPaid = authenticatedMutation({
  args: {
    id: vv.id('expenseLedger'),
  },
  minimumRole: 'employee',
  handler: async (ctx, { id }) => {
    const expense = await ctx.db.get(id)

    if (!expense) {
      throw new Error('Expense not found')
    }

    if (expense.status !== 'paid') {
      await ctx.db.patch(id, {
        status: 'paid',
        settledDate: Date.now(),
      })
    }
  },
})

export const deleteLedger = authenticatedMutation({
  args: {
    id: vv.id('expenseLedger'),
  },
  minimumRole: 'employee',
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id)
  },
})
