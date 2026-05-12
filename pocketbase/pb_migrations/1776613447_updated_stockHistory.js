/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2357868740")

  // update collection data
  unmarshal({
    "name": "stockHistoryEntities"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2357868740")

  // update collection data
  unmarshal({
    "name": "stockHistory"
  }, collection)

  return app.save(collection)
})
