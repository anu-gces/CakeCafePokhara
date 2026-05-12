/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_131323741")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\" || @request.auth.role = \"employee\" ",
    "deleteRule": "@request.auth.role = \"owner\" ",
    "listRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\" || @request.auth.role = \"employee\" ",
    "updateRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\" || @request.auth.role = \"employee\" ",
    "viewRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\" || @request.auth.role = \"employee\" "
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_131323741")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
