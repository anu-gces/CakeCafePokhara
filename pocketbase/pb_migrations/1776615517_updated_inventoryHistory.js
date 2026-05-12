/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2357868740")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2357868740")

  // update collection data
  unmarshal({
    "listRule": null
  }, collection)

  return app.save(collection)
})
