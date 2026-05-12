/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2357868740")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number4283402458",
    "max": null,
    "min": null,
    "name": "lastStockCount",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number591379874",
    "max": null,
    "min": null,
    "name": "currentStockCount",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2357868740")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number4283402458",
    "max": null,
    "min": null,
    "name": "oldStock",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number591379874",
    "max": null,
    "min": null,
    "name": "newStock",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
