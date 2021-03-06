const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

//Mongodb Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f3nx9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const productCollection = client
      .db("ownproduct")
      .collection("all_products");
    const orderCollection = client.db("ownproduct").collection("orders");
    const reviewCollection = client.db("ownproduct").collection("reviews");
    const userCollection = client.db("ownproduct").collection("users");

    const verifyJWT = (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({
          message: "UnAuthorized Access",
        });
      }
      const token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.DB_ACCESS_TOKEN, function (err, decoded) {
        if (err) {
          return res.status(403).send({
            message: "Forbidden access",
          });
        }
        req.decoded = decoded;
        next();
      });
    };

    //Get All Product
    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    //Get Product By Id
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: ObjectId(id),
      };
      const product = await productCollection.findOne(query);
      res.send(product);
    });

    //Add To Order In DB
    app.post("/order", async (req, res) => {
      const orders = req.body;
      const result = await orderCollection.insertOne(orders);
      res.send(result);
    });

    //Get Order By Email
    app.get("/order", async (req, res) => {
      const email = req.query.email;
      const query = {
        email: email,
      };
      const cursor = orderCollection.find(query);
      const order = await cursor.toArray();
      res.send(order);
    });

    //Delete One Ordeer Item
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: ObjectId(id),
      };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    //AddReview In DB
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    //Put Method For Update User If Available Otherwis CreateOne With JWT(Accesstoken)
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = {
        email: email,
      };
      const options = {
        upsert: true,
      };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        {
          email: email,
        },
        process.env.DB_ACCESS_TOKEN,
        {
          expiresIn: "24h",
        }
      );
      res.send({
        result,
        accessToken: token,
      });
    });

    //Method For Get User By Email
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = {
        email: email,
      };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    //From admin email get
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({
        email: email,
      });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        const filter = {
          email: email,
        };
        const updateDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        res.status(403).send({
          message: "forbiden access",
        });
      }
    });

    //Get All Users
    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    //Post Method For Add Product Into DB
    app.post("/addproduct", async (req, res) => {
      const newData = req.body;
      const result = await productCollection.insertOne(newData);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
