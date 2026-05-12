/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // add field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "number154007097",
    "max": null,
    "min": null,
    "name": "kotNumber",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "number402144134",
    "max": null,
    "min": null,
    "name": "tableNumber",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number673137023",
    "max": null,
    "min": null,
    "name": "discountAmount",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number2957995209",
    "max": null,
    "min": null,
    "name": "taxAmount",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "bool2753347443",
    "name": "complementary",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "convertURLs": false,
    "hidden": false,
    "id": "editor1156222427",
    "maxSize": 0,
    "name": "remarks",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "editor"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select2223302008",
    "maxSelect": 1,
    "name": "paymentMethod",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "cash",
      "esewa",
      "bank"
    ]
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "date894731252",
    "max": "",
    "min": "",
    "name": "receiptDate",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // remove field
  collection.fields.removeById("number154007097")

  // remove field
  collection.fields.removeById("number402144134")

  // remove field
  collection.fields.removeById("number673137023")

  // remove field
  collection.fields.removeById("number2957995209")

  // remove field
  collection.fields.removeById("bool2753347443")

  // remove field
  collection.fields.removeById("editor1156222427")

  // remove field
  collection.fields.removeById("select2223302008")

  // remove field
  collection.fields.removeById("date894731252")

  return app.save(collection)
})
