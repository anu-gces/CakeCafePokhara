/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800710804")

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2357868740",
    "hidden": false,
    "id": "relation2327973947",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "stockHistoryId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1579384326",
    "max": 0,
    "min": 0,
    "name": "name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(3, new Field({
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
  collection.fields.addAt(4, new Field({
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

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800710804")

  // remove field
  collection.fields.removeById("relation2327973947")

  // remove field
  collection.fields.removeById("text1579384326")

  // remove field
  collection.fields.removeById("number355024498")

  // remove field
  collection.fields.removeById("number3653259480")

  return app.save(collection)
})
