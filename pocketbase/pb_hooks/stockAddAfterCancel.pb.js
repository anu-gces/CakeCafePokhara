onRecordUpdate((e) => {
  const oldRecord = e.record.original()
  if (e.record.get('dismissed') !== oldRecord.get('dismissed')) {
    console.log('im isnide dismiss early retur')
    return e.next()
  }

  const status = e.record.get('status')
  if (status === 'cancelled') {
    let items = e.record.get('items')

    // EXACT PARSING FROM YOUR REFERENCE
    if (typeof items !== 'string' && items !== null) {
      items = JSON.parse(String.fromCharCode(...items))
    } else {
      items = JSON.parse(items || '[]')
    }

    console.log('right before trans')

    // EXACT TRANSACTION FROM YOUR REFERENCE
    e.app.runInTransaction((txApp) => {
      for (const item of items) {
        const menuItem = txApp.findRecordById('menuItems', item.menuItemId)

        const currentStock = Number(menuItem.get('currentStockCount')) || 0
        const orderQty = Number(item.qty) || 0

        // Your logic, just adding instead of subtracting
        const newStock = currentStock + orderQty

        menuItem.set('lastStockCount', currentStock)
        menuItem.set('currentStockCount', newStock)
        menuItem.set('reasonForStockEdit', 'cancelled')
        menuItem.set(
          'editedStockBy',
          e.record.get('editedBy') || e.record.get('createdBy') || '',
        )
        console.log('geeting looped n shit')
        txApp.save(menuItem)
      }
    })
  }

  return e.next()
}, 'orders')
