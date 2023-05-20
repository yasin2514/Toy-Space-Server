const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('toy server is running');
})



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zexvqii.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        client.connect();
        const galleryCollection = client.db('ToyDB').collection('gallery');
        const toyCollection = client.db('ToyDB').collection('toys');

        // toy collection indexing
        const indexKeys = { toyName: 1 }
        const indexOptions = { name: "toyName" }
        const result = await toyCollection.createIndex(indexKeys, indexOptions);

        // search price
        app.get('/toySearch/:text', async (req, res) => {
            const searchText = req.params.text;
            console.log(searchText);
            const result = await toyCollection.find({
                $or: [
                    { toyName: { $regex: searchText, $options: 'i' } }
                ]
            }).toArray();
            console.log(result);
            res.send(result)
        })


        // galleryCollection
        app.get('/gallery', async (req, res) => {
            const result = await galleryCollection.find().toArray();
            res.send(result);
        })

        // toyCollection

        app.get('/toys', async (req, res) => {
            const result = await toyCollection.find().toArray();
            res.send(result);
        })

        app.get('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toyCollection.findOne(query);
            res.send(result);
        })


        app.post('/toys', async (req, res) => {
            const toy = req.body;
            const result = await toyCollection.insertOne(toy);
            res.send(result);
        })

        app.put('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const toy = req.body;
            const options = { upsert: true };
            const updatedToy = {
                $set: {
                    price: toy.price,
                    quantity: toy.quantity,
                    description: toy.description
                }
            };
            const result = await toyCollection.updateOne(query, updatedToy, options);
            res.send(result)

        })

        app.delete('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await toyCollection.deleteOne(query);
            res.send(result);
        })

        // category 
        app.get('/category', async (req, res) => {
            let query = {};
            if (req.query.category) {
                query = { category: req.query.category }
            }
            const result = await toyCollection.find(query).toArray();
            res.send(result);

        })

        // my toys

        app.get('/myToys', async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = { email: req.query.email }
            }
            const result = await toyCollection.find(query).toArray();
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})