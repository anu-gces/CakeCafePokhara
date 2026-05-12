/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_300336867")

  // remove field
  collection.fields.removeById("date2393256231")

  // remove field
  collection.fields.removeById("date4098681852")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_300336867")

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "date2393256231",
    "max": "",
    "min": "",
    "name": "startTime",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "date4098681852",
    "max": "",
    "min": "",
    "name": "endTime",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
})
