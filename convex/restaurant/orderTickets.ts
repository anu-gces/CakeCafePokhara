import { authenticatedMutation } from '../functions'
import { ConvexError, v } from 'convex/values'
import schema from '../schema'

const orderTicketClientFields = schema.tables.orderTickets.validator.pick(
  'branchId',
  'payLaterCustomerId',
  'kotNumber',
  'tableNumber',
  'orderType',
  'totalDiscount',
  'taxAmount',
  'deliveryCharge',
  'orderDate',
  'status',
  'paymentMethod',
).fields

const orderItemClientFields = schema.tables.orderItems.validator.pick(
  'itemId',
  'quantity',
  'notes',
  'isComplimentary',
).fields

export const createOrderTicket = authenticatedMutation({
  args: {
    ...orderTicketClientFields,
    items: v.array(v.object(orderItemClientFields)),
  },
  minimumRole: 'employee',
  handler: async (ctx, args) => {
    const {
      items,
      deliveryCharge = 0,
      totalDiscount = 0,
      taxAmount = 0,
      ...ticketArgs
    } = args

    // =================================================================
    // 1. BATCH FETCH & VERIFY STOCK UPFRONT
    // =================================================================

    // Fetch all DB items in parallel using Promise.all
    const menuDbItems = await Promise.all(
      items.map((item) => ctx.db.get(item.itemId)),
    )

    // Map them by ID for instant O(1) lookups during processing
    const menuItemsMap = new Map()

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const menuDbItem = menuDbItems[i]

      if (!menuDbItem) {
        throw new ConvexError(`Menu item with ID ${item.itemId} not found`)
      }

      if (menuDbItem.stockCount < item.quantity) {
        throw new ConvexError(
          `Insufficient stock for item: ${menuDbItem.name}. Requested: ${item.quantity}, Available: ${menuDbItem.stockCount}`,
        )
      }

      // Keep track of the retrieved item for the next steps
      menuItemsMap.set(item.itemId, menuDbItem)
    }

    // =================================================================
    // 2. PROCESS FINANCIALS & APPLY MUTATIONS
    // =================================================================
    let calculatedSubTotal = 0
    const finalOrderItemsToInsert = []

    for (const item of items) {
      // Pull the already-validated item from our local map (no DB overhead here)
      const menuDbItem = menuItemsMap.get(item.itemId)
      const newStock = menuDbItem.stockCount - item.quantity

      // Deduct stock immediately
      await ctx.db.patch(item.itemId, { stockCount: newStock })

      // Log to inventory history
      await ctx.db.insert('inventoryHistory', {
        itemName: menuDbItem.name,
        previousStock: menuDbItem.stockCount,
        currentStock: newStock,
        adjustmentQuantity: -item.quantity,
        reasonForStockEdit: 'sale',
        editedBy: ctx.user._id,
      })

      const lineItemPrice = menuDbItem.price
      // if complementary then price = 0
      const lineItemNetContribution = item.isComplimentary ? 0 : lineItemPrice
      calculatedSubTotal += lineItemNetContribution * item.quantity

      finalOrderItemsToInsert.push({
        itemId: item.itemId,
        name: menuDbItem.name,
        price: lineItemPrice,
        quantity: item.quantity,
        notes: item.notes,
        isComplimentary: item.isComplimentary,
        itemStatus: 'cooking' as const,
        addedBy: ctx.user._id,
        editedBy: ctx.user._id,
      })
    }

    // 3. Run order-wide calculations
    const postDiscountSubTotal = Math.max(0, calculatedSubTotal - totalDiscount)
    const totalAmount = postDiscountSubTotal + taxAmount + deliveryCharge

    // 4. Insert parent Order Ticket
    const orderTicketId = await ctx.db.insert('orderTickets', {
      ...ticketArgs,
      subTotal: calculatedSubTotal,
      totalDiscount,
      taxAmount,
      deliveryCharge,
      totalAmount,
      status: 'active',
      addedBy: ctx.user._id,
      processedBy: ctx.user._id,
      editedBy: ctx.user._id,
    })

    // 5. Batch write order items
    for (const orderItem of finalOrderItemsToInsert) {
      await ctx.db.insert('orderItems', {
        ...orderItem,
        orderTicketId: orderTicketId,
      })
    }

    return orderTicketId
  },
})

export const addItemsToOrderTicket = authenticatedMutation({
  args: {
    orderTicketId: v.id('orderTickets'),
    items: v.array(v.object(orderItemClientFields)),
  },
  minimumRole: 'employee',
  handler: async (ctx, args) => {
    const { orderTicketId, items } = args

    // =================================================================
    // 0. FETCH EXISTING TICKET
    // =================================================================
    const existingTicket = await ctx.db.get(orderTicketId)
    if (!existingTicket) {
      throw new ConvexError(`Order ticket with ID ${orderTicketId} not found`)
    }

    // =================================================================
    // 1. BATCH FETCH & VERIFY STOCK UPFRONT
    // =================================================================
    const menuDbItems = await Promise.all(
      items.map((item) => ctx.db.get(item.itemId)),
    )

    const menuItemsMap = new Map()

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const menuDbItem = menuDbItems[i]

      if (!menuDbItem) {
        throw new ConvexError(`Menu item with ID ${item.itemId} not found`)
      }

      if (menuDbItem.stockCount < item.quantity) {
        throw new ConvexError(
          `Insufficient stock for item: ${menuDbItem.name}. Requested: ${item.quantity}, Available: ${menuDbItem.stockCount}`,
        )
      }

      menuItemsMap.set(item.itemId, menuDbItem)
    }

    // =================================================================
    // 2. PROCESS FINANCIALS & APPLY MUTATIONS
    // =================================================================
    let addedSubTotal = 0
    const finalOrderItemsToInsert = []

    for (const item of items) {
      const menuDbItem = menuItemsMap.get(item.itemId)
      const newStock = menuDbItem.stockCount - item.quantity

      // Deduct stock immediately
      await ctx.db.patch(item.itemId, { stockCount: newStock })

      // Log to inventory history
      await ctx.db.insert('inventoryHistory', {
        itemName: menuDbItem.name,
        previousStock: menuDbItem.stockCount,
        currentStock: newStock,
        adjustmentQuantity: -item.quantity,
        reasonForStockEdit: 'sale',
        editedBy: ctx.user._id,
      })

      const lineItemPrice = menuDbItem.price
      const lineItemNetContribution = item.isComplimentary ? 0 : lineItemPrice
      addedSubTotal += lineItemNetContribution * item.quantity

      finalOrderItemsToInsert.push({
        itemId: item.itemId,
        name: menuDbItem.name,
        price: lineItemPrice,
        quantity: item.quantity,
        notes: item.notes,
        isComplimentary: item.isComplimentary,
        itemStatus: 'cooking' as const,
        addedBy: ctx.user._id,
        editedBy: ctx.user._id,
      })
    }

    // 3. Run new parent totals calculation based on existing ticket values
    const newSubTotal = existingTicket.subTotal + addedSubTotal
    const postDiscountSubTotal = Math.max(
      0,
      newSubTotal - existingTicket.totalDiscount,
    )
    const newTotalAmount =
      postDiscountSubTotal +
      existingTicket.taxAmount +
      (existingTicket.deliveryCharge ?? 0)

    // 4. Update parent Order Ticket
    await ctx.db.patch(orderTicketId, {
      subTotal: newSubTotal,
      totalAmount: newTotalAmount,
      editedBy: ctx.user._id,
    })

    // 5. Batch write new order items linked to this ticket
    for (const orderItem of finalOrderItemsToInsert) {
      await ctx.db.insert('orderItems', {
        ...orderItem,
        orderTicketId: orderTicketId,
      })
    }

    return orderTicketId
  },
})
