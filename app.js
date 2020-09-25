const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

// create and/or localhost and db



const uri = "mongodb+srv://admin-zty:test123@cluster0.numyi.gcp.mongodb.net/todolistDB";
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// items schema
const itemsSchema = {
    name: String
}

//list shcema, has name and item documents
const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)

// items model based on items schema
const Item = mongoose.model("Item", itemsSchema);

const ItemOne = new Item({
    name: "Cook breakfast"
});

const ItemTwo = new Item({
    name: "Eat food"
});

const ItemThree = new Item({
    name: "Feed dog"
});

const defaultItems = [ItemOne, ItemTwo, ItemThree];
const todayDate = new Date();


// tell app to use/activate ejs
app.set("view engine", "ejs");



app.get("/", function (req, res) {

    // find all items in items collection
    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Added " + defaultItems + " to collection");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems
            });
        }
        // const day = date.getDate(); IMPLEMENT THIS AT A LATER DATE
    });
});


//use para route to create dynamic route for user generated list
app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function (err, foundList) {
            if (!err) {
                if (!foundList) {
                    const list = new List({
                        name: customListName,
                        items: defaultItems
                    });
                    list.save();
                    res.redirect("/" + customListName)
                } else {
                    res.render("list", {
                        listTitle: foundList.name,
                        newListItems: foundList.items
                    });
                }

            }
    })
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list; // allows button to add to current list

    const item = new Item({
        name: itemName
    });

    // check if listName value is equal to global and display; else find user listname in data and add created item 
    // to *that list
    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name : listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName)
        });
    };
})

app.post("/delete", function (req, res) {
    const checkedItemID = req.body.checkBox;
    const listName = req.body.listName;
    console.log(listName);

    if(listName === "Today") {
        Item.findByIdAndRemove(checkedItemID, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log(checkedItemID + " has been removed")
                res.redirect("/");
            }
        })
    } else {
        // pull from items array, with and id that matches what we want
        List.findOneAndUpdate({name: listName}, {$pull : {items : {_id : checkedItemID}}}, function(err, foundList){
            if(!err) {
                res.redirect("/" + listName);
            }
        });
    }
})

app.listen(3000, function () {
    console.log("Server started on port" + 3000)
})
