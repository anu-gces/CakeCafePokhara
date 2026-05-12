/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_578440281")

  // update collection data
  unmarshal({
    "name": "foodItems"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_578440281")

  // update collection data
  unmarshal({
    "name": "menuItems"
  }, collection)

  return app.save(collection)
})
