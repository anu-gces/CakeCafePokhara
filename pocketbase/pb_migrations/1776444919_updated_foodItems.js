/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_578440281")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1579384326",
    "max": 0,
    "min": 0,
    "name": "name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "number3402113753",
    "max": null,
    "min": null,
    "name": "price",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2363381545",
    "max": 0,
    "min": 0,
    "name": "type",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select2134455043",
    "maxSelect": 1,
    "name": "mainCategory",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "appetizers",
      "main_courses",
      "bakery",
      "desserts",
      "beverages",
      "hard_drinks",
      "specials",
      "others"
    ]
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "file2047774360",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "photoURL",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number3653259480",
    "max": null,
    "min": null,
    "name": "currentStockCount",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number355024498",
    "max": null,
    "min": null,
    "name": "lastStockCount",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
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

  // add field
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

  // add field
  collection.fields.addAt(10, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation3888809020",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "addedBy",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_578440281")

  // remove field
  collection.fields.removeById("text1579384326")

  // remove field
  collection.fields.removeById("number3402113753")

  // remove field
  collection.fields.removeById("text2363381545")

  // remove field
  collection.fields.removeById("select2134455043")

  // remove field
  collection.fields.removeById("file2047774360")

  // remove field
  collection.fields.removeById("number3653259480")

  // remove field
  collection.fields.removeById("number355024498")

  // remove field
  collection.fields.removeById("relation3204012831")

  // remove field
  collection.fields.removeById("select180190976")

  // remove field
  collection.fields.removeById("relation3888809020")

  return app.save(collection)
})
