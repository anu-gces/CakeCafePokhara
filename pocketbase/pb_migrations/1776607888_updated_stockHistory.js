/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2357868740")

  // remove field
  collection.fields.removeById("text2836976544")

  // remove field
  collection.fields.removeById("number4283402458")

  // remove field
  collection.fields.removeById("number591379874")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "json1368010085",
    "maxSize": 0,
    "name": "changes",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2357868740")

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2836976544",
    "max": 0,
    "min": 0,
    "name": "nameSnapshot",
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

  // add field
  collection.fields.addAt(4, new Field({
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

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "json1368010085",
    "maxSize": 0,
    "name": "menuItemName",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
})
