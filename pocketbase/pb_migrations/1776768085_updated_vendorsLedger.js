/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1345636481")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1345636481")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.role = \"owner\" || @request.auth.role = \"admin\" ||  @request.auth.role = \"employee\""
  }, collection)

  return app.save(collection)
})
