/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_566627753")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_nxCLonuDXX` ON `fcm_tokens` (`uniqueKey`)"
    ]
  }, collection)

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text928688954",
    "max": 0,
    "min": 0,
    "name": "uniqueKey",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_566627753")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  // remove field
  collection.fields.removeById("text928688954")

  return app.save(collection)
})
