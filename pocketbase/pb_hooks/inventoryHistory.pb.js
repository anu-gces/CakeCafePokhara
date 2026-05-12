// Using the Record proxy model hook
onRecordUpdate((e) => {
  // 1. Let the record update finish its validation and DB statement first
  e.next()

  // 2. Now we check the changes
  const newStock = Number(e.record.get('currentStockCount'))
  const oldStock = Number(e.record.original().get('currentStockCount'))

  // 3. Compare. If no change, we're done.
  if (newStock === oldStock) {
    return
  }

  // 4. Create history log
  try {
    const historyCollection = e.app.findCollectionByNameOrId('inventoryHistory')

    const historyRecord = new Record(historyCollection, {
      name: e.record.get('name'),
      lastStockCount: oldStock,
      currentStockCount: newStock,
      reasonForStockEdit: e.record.get('reasonForStockEdit') || 'correction',
      editedStockBy: e.record.get('editedStockBy'),
    })

    // This save is also part of the same transaction
    e.app.save(historyRecord)
  } catch (err) {
    throw err
    // Optional: throw err if you want to fail the whole update if logging fails
  }
}, 'menuItems')
