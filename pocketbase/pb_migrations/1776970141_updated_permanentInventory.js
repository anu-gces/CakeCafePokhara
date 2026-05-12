/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3623897782")

  // update collection data
  unmarshal({
    "name": "assets"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3623897782")

  // update collection data
  unmarshal({
    "name": "permanentInventory"
  }, collection)

  return app.save(collection)
})
