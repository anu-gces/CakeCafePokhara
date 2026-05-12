/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_300336867")

  // update collection data
  unmarshal({
    "name": "calendarEvents"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_300336867")

  // update collection data
  unmarshal({
    "name": "calenderEvents"
  }, collection)

  return app.save(collection)
})
