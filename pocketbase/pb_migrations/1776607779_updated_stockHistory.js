/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2357868740")

  // remove field
  collection.fields.removeById("relation2847964604")

  // add field
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
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2357868740")

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_578440281",
    "hidden": false,
    "id": "relation2847964604",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "menuItemId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // remove field
  collection.fields.removeById("json1368010085")

  return app.save(collection)
})
