const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://admin-xelyfer:<password>@cluster0.ssxx1.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  }
);

const itemsSchema = {
  name: {
    type: String,
    required: true,
  },
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Do 1 hour of coding/learning.",
});

const item2 = new Item({
  name: "Do another 1 hour of coding/learning.",
});

const item3 = new Item({
  name: "Do a 3rd time of 1 hour coding/learning.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: {
    type: String,
    required: true,
  },
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, result) {
    if (result.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("No error inserting many");
        }
      });
      res.redirect("/");
    } else {
      if (err) {
        console.log(err);
      } else {
        res.render("list", { listTitle: "Today", newListItems: result });
      }
    }
  });
});

app.get("/:customUrlName", function (req, res) {
  const customUrlName = _.capitalize(req.params.customUrlName);

  List.findOne(
    {
      name: customUrlName,
    },
    function (err, result) {
      if (!err) {
        if (!result) {
          // Create a new list
          const list = new List({
            name: customUrlName,
            items: defaultItems,
          });
          list.save();
          res.redirect("/" + customUrlName);
        } else {
          // Show an existing list

          res.render("list", {
            listTitle: result.name,
            newListItems: result.items,
          });
        }
      }
    }
  );
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, result) {
      if (!err) {
        result.items.push(newItem);
        result.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("No problem removing " + checkedItemID);
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemID } } },
      function (err, result) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started sucessfully");
});
