/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_566627753")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_nxCLonuDXX` ON `fcm_tokens` (`uniqueKey`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_566627753")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_nxCLonuDXX` ON `fcm_tokens` (`uniqueKey`)"
    ]
  }, collection)

  return app.save(collection)
})
