/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800710804")

  // update collection data
  unmarshal({
    "name": "stockHistoryEntities"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800710804")

  // update collection data
  unmarshal({
    "name": "stockHistoryBatch"
  }, collection)

  return app.save(collection)
})
