const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const {
        MongoClient,
        ServerApiVersion,
        ObjectId
} = require('mongodb');
require('dotenv').config();
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
        serverApi: ServerApiVersion.v1
});


async function run() {
        try {
                await client.connect();
                const productCollection = client.db('ownproduct').collection('all_products');
                const orderCollection = client.db('ownproduct').collection('orders');
                const reviewCollection = client.db('ownproduct').collection('reviews');
                const userCollection = client.db('ownproduct').collection('users');

                //Get All Product
                app.get('/products', async (req, res) => {
                        const query = {};
                        const cursor = productCollection.find(query);
                        const products = await cursor.toArray();
                        res.send(products);
                })

                //Get Product By Id
                app.get('/product/:id', async (req, res) => {
                        const id = req.params.id;
                        const query = {
                                _id: ObjectId(id)
                        }
                        const product = await productCollection.findOne(query);
                        res.send(product);
                })

                //Add To Order In DB
                app.post('/order', async (req, res) => {
                        const orders = req.body;
                        const result = await orderCollection.insertOne(orders);
                        res.send(result)
                })

                //Get Order By Email
                app.get('/order', async (req, res) => {
                        const email = req.query.email;
                        const query = {
                                email: email
                        };
                        const cursor = orderCollection.find(query);
                        const order = await cursor.toArray();
                        res.send(order);
                })

                //Delete One Ordeer Item
                app.delete('/orders/:id', async (req, res) => {
                        const id = req.params.id;
                        const query = {
                                _id: ObjectId(id)
                        }
                        const result = await orderCollection.deleteOne(query);
                        res.send(result)
                })

                //AddReview In DB
                app.post('/review', async (req, res) => {
                        const review = req.body;
                        const result = await reviewCollection.insertOne(review);
                        res.send(result)
                })

                //Put Method For Update User If Available Otherwis CreateOne With JWT(Accesstoken)
                app.put('/user/:email', async (req, res) => {
                        const email = req.params.email;
                        const user = req.body;
                        const filter = {
                                email: email
                        }
                        const options = {
                                upsert: true
                        }
                        const updateDoc = {
                                $set: user,
                        }
                        const result = await userCollection.updateOne(filter, updateDoc, options)
                        const token = jwt.sign({
                                email: email
                        }, process.env.DB_ACCESS_TOKEN, {
                                expiresIn: '1h'
                        })
                        res.send({
                                result,
                                accessToken: token
                        })
                });

                //Method For Get User
                app.get('/user/:email', async (req, res) => {
                        const email = req.query.email;

                        const query = {
                                email: email
                        };
                        const cursor = await userCollection.find(query);
                        const user = await cursor.toArray();
                        res.send(user);
                })

        } finally {}
}
run().catch(console.dir);





app.get('/', (req, res) => {
        res.send('Hello World!')
})

app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
})