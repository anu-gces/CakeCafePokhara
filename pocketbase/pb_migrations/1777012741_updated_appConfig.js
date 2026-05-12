/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3957763459")

  // update collection data
  unmarshal({
    "name": "seedConfig"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "number926777592",
    "max": null,
    "min": null,
    "name": "seedAmount",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "date2165318244",
    "max": "",
    "min": "",
    "name": "seedDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3957763459")

  // update collection data
  unmarshal({
    "name": "appConfig"
  }, collection)

  // remove field
  collection.fields.removeById("number926777592")

  // remove field
  collection.fields.removeById("date2165318244")

  return app.save(collection)
})
