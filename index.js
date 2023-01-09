const express = require('express')
const app = express();
const cors = require('cors');
const jwt = require("jsonwebtoken");
const { sign } = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());

// DocServiceDB
// 29winpaq7nNvVqgS

console.log(process.env.SECRET_DB_NAME);

const uri = `mongodb+srv://${process.env.SECRET_DB_NAME}:${process.env.SECRET_DB_PASS}@cluster0.ksaovkw.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const DocServiceDBCollectoin = client.db("DocServiceDB").collection("Services");
        const doc = {
            title: "Doc Service",
            content: "Doc Service content",
        }
        const result = await DocServiceDBCollectoin.insertOne(doc);

        console.log(`A d: ${result.insertedId}`);
    }








    finally {
        //   await client.close();
    }
}
run().catch(console.dir);










app.get('/', (req, res) => {
    res.send('DocService! This is the DocService Server.')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
