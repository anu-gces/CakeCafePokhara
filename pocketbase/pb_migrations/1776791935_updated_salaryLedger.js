/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2408639152")

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "date2715507337",
    "max": "",
    "min": "",
    "name": "datePaid",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2408639152")

  // remove field
  collection.fields.removeById("date2715507337")

  return app.save(collection)
})
