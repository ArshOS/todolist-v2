//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

// Database connection
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
});

// Create schema
const itemsSchema = {
  name: String,
};

// Create mongoose model
const Item = mongoose.model("Item", itemsSchema);

// Create three new documents to initially populate the list
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

// Schema for custom lists
const listSchema = {
  name: String,
  items: [itemsSchema],
};

// Model for custom lists
const List = mongoose.model("List", listSchema);

// Insert default items into the list only for the nvery first time.
Item.countDocuments({}, function (err, count) {
  if (err) {
    console.log(err);
  }

  if (count == 0) {
    // Insert defaut items into the list.
    Item.insertMany(defaultItems, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Insertion successfull");
      }
    });
  }
});

app.get("/", function (req, res) {
  // const day = date.getDate();

  // Read data from database
  Item.find({}, function (err, foundItems) {
    // mongoose.connection.close();
    if (err) {
      console.log(err);
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if(listName === "Today") {
    newItem.save();
    res.redirect("/");
  }
  else {
    List.findOne({name: listName}, function(err, foundList) {
      if(!err) {
        if(foundList) {
          foundList.items.push(newItem);
          foundList.save();
          res.redirect("/" + listName);
        }
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.deleteMany({ _id: checkedItemId }, function (err) {
      if (err) {
        console.log(err);
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndDelete({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const newList = new List({
          name: customListName,
          items: defaultItems,
        });
        newList.save();
        res.redirect("/" + customListName);
      }
      else {
        res.render("list", { listTitle: customListName, newListItems: foundList.items });
      }
    }
  });

});


app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});








