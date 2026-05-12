/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_578440281")

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select180190976",
    "maxSelect": 1,
    "name": "reasonForStockEdit",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "restock",
      "sale",
      "waste",
      "correction",
      "cancelled"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_578440281")

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select180190976",
    "maxSelect": 1,
    "name": "reasonforStockEdit",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "restock",
      "sale",
      "waste",
      "correction",
      "cancelled"
    ]
  }))

  return app.save(collection)
})
