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

const uri = `mongodb+srv://${process.env.SECRET_DB_NAME}:${process.env.SECRET_DB_PASS}@cluster0.ksaovkw.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {
        const DocServiceDBCollection = client.db("DocServiceDB").collection("Services");
        const AppointmentsCollection = client.db("DocServiceDB").collection("appointmentOptions");
        const BookingCollection = client.db("DocServiceDB").collection("Bookings");

        app.get('/services', async (req, res) => {
            const query = {};
            const result = await DocServiceDBCollection.find(query).toArray();
            res.send(result);
        });

        app.get('/services/:name', async (req, res) => {
            const name = req.params.name;
            let query = { name: name };
            const results = await DocServiceDBCollection.find(query).toArray();
            res.send(results);
        });

        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date;
            const query = {};
            const options = await AppointmentsCollection.find(query).toArray();

            const bookingQuery = { appointmentDate: date }
            const alreadyBooked = await BookingCollection.find(bookingQuery).toArray();

            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatmentName === option.treatmentName);
                const bookedSlots = optionBooked.map(book => book.slot);
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                option.slots = remainingSlots;
            });
            console.log(options);

            res.send(options);
        })



        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await BookingCollection.insertOne(booking);
            res.send(result);
        });



















    }


    finally {

        //   await client.close();
    }
}
run().catch(error => console.log(error));










app.get('/', (req, res) => {
    res.send('DocService! This is the DocService Server.')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
