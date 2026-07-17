import { authenticatedQuery, authenticatedMutation } from '../functions'
import schema from '../schema'
import { v } from 'convex/values'

export const listMenuItems = authenticatedQuery({
  args: {},
  minimumRole: 'employee',
  handler: async (ctx) => {
    const items = await ctx.db.query('menuItems').collect()
    return Promise.all(
      items.map(async (item) => ({
        ...item,
        photoURL: item.photoId ? await ctx.storage.getUrl(item.photoId) : null,
      })),
    )
  },
})

export const addMenuItem = authenticatedMutation({
  args: schema.tables.menuItems.validator.omit('addedBy', 'editedBy').fields,
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    const { stockCount, ...remainingArgs } = args
    const menuItemId = await ctx.db.insert('menuItems', {
      stockCount: 0,
      ...remainingArgs,
      addedBy: ctx.user._id,
      editedBy: ctx.user._id,
    })
    return menuItemId
  },
})

export const editMenuItem = authenticatedMutation({
  args: {
    id: v.id('menuItems'),
    ...schema.tables.menuItems.validator.pick(
      'name',
      'price',
      'mainCategory',
      'type',
    ).fields,
  },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    const { id, ...fields } = args
    await ctx.db.patch(id, {
      ...fields,
      editedBy: ctx.user._id,
    })
  },
})

export const deleteMenuItem = authenticatedMutation({
  args: {
    id: v.id('menuItems'),
  },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    const { id } = args
    const item = await ctx.db.get(id)
    await ctx.db.delete(id)
    // delete the associated photo if it exists
    if (item?.photoId) {
      await ctx.storage.delete(item.photoId)
    }
  },
})

// export const editMenuItemStockCount = authenticatedMutation({
//   args: {
//     id: v.id('menuItems'),
//     stockCount: menuItemFields.stockCount,
//     reasonForStockEdit: v.optional(v.string()),
//   },
//   minimumRole: 'manager',
//   handler: async (ctx, args) => {
//     const { id, stockCount, reasonForStockEdit } = args
//     await ctx.db.patch(id, {
//       stockCount: stockCount,
//       editedBy: ctx.user._id,
//     })
//   },
// })

export const editMenuItemStockCount = authenticatedMutation({
  args: {
    id: v.id('menuItems'),
    ...schema.tables.menuItems.validator.pick('stockCount').fields,
    ...schema.tables.inventoryHistory.validator.pick('reasonForStockEdit')
      .fields,
  },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    const { id, stockCount, reasonForStockEdit } = args

    // 1. Fetch the snapshot BEFORE updating it
    const oldItem = await ctx.db.get(id)
    if (!oldItem) {
      throw new Error('Menu item not found')
    }

    const previousStock = oldItem.stockCount ?? 0
    const adjustmentQuantity = stockCount - previousStock

    // Optional optimization: If there is no net delta change, skip the redundant database roundtrips
    if (adjustmentQuantity === 0) {
      return
    }

    // 2. Update the main menu items document
    await ctx.db.patch(id, {
      stockCount: stockCount,
      editedBy: ctx.user._id,
    })

    // 3. Insert the transactional history line-item row
    await ctx.db.insert('inventoryHistory', {
      itemName: oldItem.name,
      previousStock,
      currentStock: stockCount,
      adjustmentQuantity,
      reasonForStockEdit: reasonForStockEdit,
      editedBy: ctx.user._id,
    })
  },
})
