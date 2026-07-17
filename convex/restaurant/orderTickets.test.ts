import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from '../schema'
import { api } from '../_generated/api'
import { modules } from '../testConfig.shared'
import { FunctionArgs } from 'convex/server'

test('successfully creates order ticket and decrements stock', async () => {
  // 1. Initialize our clean, virtual database
  const t = convexTest(schema, modules)

  // 2. Insert seed data (Branch & Menu Item) directly into the test DB
  const { branchId, menuItemId, userId } = await t.run(async (ctx) => {
    const branchId = await ctx.db.insert('branches', {
      name: 'Cake Cafe',
    })

    const userId = await ctx.db.insert('users', {
      name: 'John Doe',
      email: 'johndoe@gmail.com',
      role: 'employee',
      // Include any other required fields your 'users' schema expects
    })

    const menuItemId = await ctx.db.insert('menuItems', {
      name: 'Truffle Fries',
      price: 12,
      stockCount: 10,
      addedBy: userId,
      editedBy: userId,
      mainCategory: 'main_courses',
    })

    return { branchId, menuItemId, userId }
  })

  // 3. Define the dummy argument payload the client would send
  const orderPayload: FunctionArgs<
    typeof api.restaurant.orderTickets.createOrderTicket
  > = {
    branchId,
    kotNumber: 'KOT-123',
    tableNumber: 2,
    orderType: 'dine-in',
    totalDiscount: 2, // Order-wide discount ($2 off)
    deliveryCharge: 0,
    taxAmount: 2,
    orderDate: Date.now(),
    status: 'active' as const,
    paymentMethod: 'cash',
    items: [
      {
        itemId: menuItemId,
        quantity: 2, // Ordering 2 orders of fries
        isComplimentary: false,
      },
    ],
  }

  // 4. Run the actual mutation we want to test

  const orderTicketId = await t
    .withIdentity({
      subject: userId, // This maps to ctx.auth.getUserIdentity().subject
      name: 'John Doe',
      email: 'john@restaurant.com',
      // If your role logic reads directly from the JWT/Identity token:
      role: 'employee',
    })
    .mutation(api.restaurant.orderTickets.createOrderTicket, orderPayload)

  // 5. Look back into the virtual database and verify the side-effects
  await t.run(async (ctx) => {
    // Assert 1: Did the order ticket save correctly?
    const ticket = await ctx.db.get(orderTicketId)
    expect(ticket).toBeDefined()

    // Subtotal = $12 * 2 = $24. Post-discount = $22.
    expect(ticket?.subTotal).toBe(24)
    expect(ticket?.totalAmount).toBe(24)

    // Assert 2: Did the stock levels drop? (10 minus 2 should be 8)
    const updatedItem = await ctx.db.get(menuItemId)
    expect(updatedItem?.stockCount).toBe(8)

    // Assert 3: Was an audit log successfully generated?
    const logs = await ctx.db.query('inventoryHistory').collect()
    expect(logs.length).toBe(1)
    expect(logs[0].adjustmentQuantity).toBe(-2)
  })
})

test('handles concurrent orders on the same item without overselling', async () => {
  const t = convexTest(schema, modules)

  // Seed item with only 2 stock left
  const { branchId, menuItemId, userId } = await t.run(async (ctx) => {
    const userId = await ctx.db.insert('users', {
      name: 'Staff',
      email: 'a@b.com',
      role: 'employee',
    })
    const branchId = await ctx.db.insert('branches', { name: 'Cake Cafe' })
    const menuItemId = await ctx.db.insert('menuItems', {
      name: 'Limited Truffle Fries',
      price: 12,
      stockCount: 2, // Only 2 left!
      addedBy: userId,
      editedBy: userId,
      mainCategory: 'main_courses',
    })
    return { branchId, menuItemId, userId }
  })

  const orderPayload: FunctionArgs<
    typeof api.restaurant.orderTickets.createOrderTicket
  > = {
    branchId,
    kotNumber: 'KOT-123',
    tableNumber: undefined,
    orderType: 'takeaway',
    totalDiscount: 0,
    deliveryCharge: 0,
    taxAmount: 0,
    orderDate: Date.now(),
    status: 'active' as const,
    paymentMethod: 'cash',
    items: [{ itemId: menuItemId, quantity: 2, isComplimentary: false }], // Wants all 2
  }

  // Fire both mutations simultaneously
  const executionBatch = Promise.allSettled([
    t
      .withIdentity({ subject: userId, role: 'employee' })
      .mutation(api.restaurant.orderTickets.createOrderTicket, orderPayload),
    t
      .withIdentity({ subject: userId, role: 'employee' })
      .mutation(api.restaurant.orderTickets.createOrderTicket, orderPayload),
  ])

  const results = await executionBatch

  const succeeded = results.filter((r) => r.status === 'fulfilled')
  const failed = results.filter((r) => r.status === 'rejected')

  // One order claims the stock, the second one fails cleanly because stock is now 0
  expect(succeeded.length).toBe(1)
  expect(failed.length).toBe(1)

  await t.run(async (ctx) => {
    const updatedItem = await ctx.db.get(menuItemId)
    expect(updatedItem?.stockCount).toBe(0) // Safe at 0, never -2!
  })
})

test('rejects an order if the requested quantity exceeds available stock', async () => {
  const t = convexTest(schema, modules)

  // 1. Seed item with only 2 stock left
  const { branchId, menuItemId, userId } = await t.run(async (ctx) => {
    const userId = await ctx.db.insert('users', {
      name: 'Staff',
      email: 'a@b.com',
      role: 'employee',
    })
    const branchId = await ctx.db.insert('branches', { name: 'Cake Cafe' })
    const menuItemId = await ctx.db.insert('menuItems', {
      name: 'Limited Truffle Fries',
      price: 12,
      stockCount: 2, // Only 2 left!
      addedBy: userId,
      editedBy: userId,
      mainCategory: 'main_courses',
    })
    return { branchId, menuItemId, userId }
  })

  // 2. Try to order 3 items (exceeding the stock of 2)
  const heavyOrderPayload: FunctionArgs<
    typeof api.restaurant.orderTickets.createOrderTicket
  > = {
    branchId,
    kotNumber: 'KOT-999',
    tableNumber: undefined,
    orderType: 'takeaway',
    totalDiscount: 0,
    deliveryCharge: 0,
    taxAmount: 0,
    orderDate: Date.now(),
    status: 'active' as const,
    paymentMethod: 'cash',
    items: [{ itemId: menuItemId, quantity: 3, isComplimentary: false }], // Ordering 3!
  }

  // 3. Assert that the mutation rejects/throws an error
  await expect(
    t
      .withIdentity({ subject: userId, role: 'employee' })
      .mutation(
        api.restaurant.orderTickets.createOrderTicket,
        heavyOrderPayload,
      ),
  ).rejects.toThrow() // You can pass a specific error message string inside toThrow('Insufficient stock') if your mutation throws one

  // 4. Verify stock remains untouched at 2
  await t.run(async (ctx) => {
    const item = await ctx.db.get(menuItemId)
    expect(item?.stockCount).toBe(2)
  })
})
