const express = require('express');
const cors = require('cors');
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

                app.get('/products', async (req, res) => {
                        const query = {};
                        const cursor = productCollection.find(query);
                        const products = await cursor.toArray();
                        res.send(products);
                })

                app.get('/product/:id', async (req, res) => {
                        const id = req.params.id;
                        const query = {
                                _id: ObjectId(id)
                        }
                        const product = await productCollection.findOne(query);
                        res.send(product);
                })

                //Post
                app.post('/order', async (req, res) => {
                        const orders = req.body;
                        const result = await orderCollection.insertOne(orders);
                        res.send(result)
                })

                app.get('/order', async (req, res) => {
                        const email = req.query.email;
                        const query = {
                                email: email
                        };
                        const cursor = orderCollection.find(query);
                        const order = await cursor.toArray();
                        res.send(order);
                })

                //Delete
                app.delete('/orders/:id', async (req, res) => {
                        const id = req.params.id;
                        const query = {
                                _id: ObjectId(id)
                        }
                        const result = await orderCollection.deleteOne(query);
                        res.send(result)
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