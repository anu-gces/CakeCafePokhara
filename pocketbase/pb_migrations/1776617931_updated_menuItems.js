/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_578440281")

  // update field
  collection.fields.addAt(8, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation3204012831",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "editedStockBy",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

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
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_578440281")

  // update field
  collection.fields.addAt(8, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation3204012831",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "editedStockBy",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select180190976",
    "maxSelect": 1,
    "name": "reasonforStockEdit",
    "presentable": false,
    "required": true,
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
