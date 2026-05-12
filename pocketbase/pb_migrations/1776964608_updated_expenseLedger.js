/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_131323741")

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select3441287562",
    "maxSelect": 1,
    "name": "department",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "kitchen",
      "bakery",
      "barista",
      "utility"
    ]
  }))

  // add field
  collection.fields.addAt(9, new Field({
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

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_131323741")

  // remove field
  collection.fields.removeById("select3441287562")

  // remove field
  collection.fields.removeById("text2363381545")

  return app.save(collection)
})
