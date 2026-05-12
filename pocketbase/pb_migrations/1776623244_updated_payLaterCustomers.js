/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2640420469")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\" ||  @request.auth.role = \"employee\"",
    "viewRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\" || @request.auth.role = \"employee\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2640420469")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\"",
    "viewRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
})
