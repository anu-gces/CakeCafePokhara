onRecordCreate((e) => {
  let items = e.record.get('items')
  // Handle byte slice conversion if necessary
  if (typeof items !== 'string' && items !== null) {
    items = JSON.parse(String.fromCharCode(...items))
  } else {
    items = JSON.parse(items || '[]')
  }

  // Wrap everything in a manual transaction block for absolute safety
  e.app.runInTransaction((txApp) => {
    for (const item of items) {
      // 1. Fetch the record using the transaction-aware app (txApp)
      const menuItem = txApp.findRecordById('menuItems', item.menuItemId)

      const currentStock = Number(menuItem.get('currentStockCount')) || 0
      const orderQty = Number(item.qty) || 0

      // 2. HARD VALIDATION: Stop the order if someone else took the stock 1ms ago
      if (currentStock < orderQty) {
        throw new BadRequestError(
          `Insufficient stock for ${menuItem.get('name')}. Remaining: ${currentStock}`,
        )
      }

      const newStock = currentStock - orderQty

      // 3. Update the menu item
      menuItem.set('lastStockCount', currentStock)
      menuItem.set('currentStockCount', newStock)
      menuItem.set('reasonForStockEdit', 'sale')
      menuItem.set('editedStockBy', e.record.get('createdBy') || '')

      // 4. Save using txApp
      // If this fails, or if the loop throws, the Order is never created.
      txApp.save(menuItem)
    }
  })

  // If we reach here, all stock was subtracted successfully.
  // Now the Order record itself is saved.
  return e.next()
}, 'orders')
