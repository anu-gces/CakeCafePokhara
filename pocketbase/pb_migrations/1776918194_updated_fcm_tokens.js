/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_566627753")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_566627753")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_DV7pWfVYiy` ON `fcm_tokens` (`userId`)"
    ]
  }, collection)

  return app.save(collection)
})
