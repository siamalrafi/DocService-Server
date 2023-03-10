const express = require('express')
const app = express();
const cors = require('cors');
const jwt = require("jsonwebtoken");
const { sign } = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { request } = require('express');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// DocServiceDB
// 29winpaq7nNvVqgS



const uri = `mongodb+srv://${process.env.SECRET_DB_NAME}:${process.env.SECRET_DB_PASS}@cluster0.ksaovkw.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
    });
    next();

}
async function run() {

    try {
        const DocServiceDBCollection = client.db("DocServiceDB").collection("Services");
        const AppointmentsCollection = client.db("DocServiceDB").collection("appointmentOptions");
        const BlogsCollection = client.db("DocServiceDB").collection("Blogs");
        const BookingCollection = client.db("DocServiceDB").collection("Bookings");
        const UsersCollection = client.db("DocServiceDB").collection("users");
        const DoctorsCollection = client.db("DocServiceDB").collection("Doctors");
        const PaymentsCollection = client.db("DocServiceDB").collection("payments");


        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await UsersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        };

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

            res.send(options);
        });

        app.get('/blogs', async (req, res) => {
            const query = {};
            const results = await BlogsCollection.find(query).toArray();
            res.send(results);
        })

        app.get('/blogs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await BlogsCollection.findOne(query)
            res.send(result)
        });

        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const bookings = await BookingCollection.find(query).toArray();
            res.send(bookings);
        });

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await BookingCollection.findOne(query);
            res.send(booking);
        });

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await BookingCollection.insertOne(booking);
            res.send(result);
        });

        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await BookingCollection.deleteOne(query);
            res.send(result);
        });

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await UsersCollection.findOne(query);

            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            };
            res.status(403).send({ accessToken: '' });

        });

        app.get('/users', async (req, res) => {
            const query = {};
            const result = await UsersCollection.find(query).toArray();
            res.send(result);
        });

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await UsersCollection.findOne(query);
            res.send({ isAdmin: user?.role == 'admin' });
        });

        // Post a new user.
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await UsersCollection.insertOne(user);
            res.send(result)
        });

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await UsersCollection.deleteOne(query);
            res.send(result);


        });


        app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {

            // Make a admin 
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await UsersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });


        app.get('/appointmentSpecialty', async (req, res) => {
            const query = {};
            const result = await AppointmentsCollection.find(query).project({ treatmentName: 1 }).toArray();
            res.send(result);
        });

        // post a doctor
        app.post('/doctors', async (req, res) => {
            const doctor = req.body;
            const result = await DoctorsCollection.insertOne(doctor);
            res.send(result);
        });

        app.get('/doctors', async (req, res) => {
            const query = {};
            const result = await DoctorsCollection.find(query).toArray();
            res.send(result);
        });

        app.delete('/doctors/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await DoctorsCollection.deleteOne(query);
            res.send(result);
        });


        // payment system integration tests
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });


        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await PaymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await BookingCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

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
