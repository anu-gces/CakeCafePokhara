onRecordCreate((e) => {
  const allowedItemFields = ['menuItemId', 'name', 'price', 'qty']

  let items = e.record.get('items')
  items = JSON.parse(String.fromCharCode(...items))

  if (!Array.isArray(items) || items.length === 0) {
    throw new BadRequestError('Order must have at least one item')
  }

  const sanitizedItems = items.map((item) => {
    const clean = {}
    for (const field of allowedItemFields) {
      if (item[field] !== undefined) {
        clean[field] = item[field]
      }
    }
    const menuItem = e.app.findRecordById('menuItems', clean.menuItemId)
    const currentStock = Number(menuItem.get('currentStockCount')) || 0
    if (currentStock < clean.qty) {
      throw new BadRequestError(
        `Not enough stock for ${clean.name}. Available: ${currentStock}`,
      )
    }
    if (typeof clean.menuItemId !== 'string')
      throw new BadRequestError('Item id must be a string')
    if (typeof clean.name !== 'string')
      throw new BadRequestError('Item name must be a string')
    if (typeof clean.price !== 'number' || clean.price < 0)
      throw new BadRequestError('Item price must be a non-negative number')
    if (typeof clean.qty !== 'number' || clean.qty < 1)
      throw new BadRequestError('Item qty must be at least 1')

    return clean
  })

  e.record.set('items', sanitizedItems)
  e.record.set('status', 'pending')
  e.record.set('dismissed', false)

  e.next()
}, 'orders')
