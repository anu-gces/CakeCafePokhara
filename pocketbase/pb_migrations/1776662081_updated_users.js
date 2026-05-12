/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.role = \"owner\" ",
    "listRule": "@request.auth.role = \"owner\" || @request.auth.role = \"manager\" || @request.auth.role = \"employee\"",
    "viewRule": "@request.auth.role = \"owner\" || @request.auth.role = \"manager\" || @request.auth.role = \"employee\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "deleteRule": "id = @request.auth.id",
    "listRule": "id = @request.auth.id",
    "viewRule": "id = @request.auth.id"
  }, collection)

  return app.save(collection)
})
