/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3623897782")

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "select3441287562",
    "maxSelect": 1,
    "name": "department",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "permanentInventory",
      "equipment"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3623897782")

  // remove field
  collection.fields.removeById("select3441287562")

  return app.save(collection)
})
