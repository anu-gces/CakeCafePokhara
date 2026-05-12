/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_566627753")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_vhxVuBTakp` ON `fcm_tokens` (`token`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_566627753")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
