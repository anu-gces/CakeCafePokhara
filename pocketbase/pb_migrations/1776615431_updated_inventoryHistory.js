/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2357868740")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\"",
    "deleteRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\"",
    "updateRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\" || @request.auth.role = \"employee\"",
    "viewRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2357868740")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
