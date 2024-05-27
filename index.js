const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 5000;
const cors = require('cors');
const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Food Monster Server is Running');
});

// MongoDB конфігурація
const uri = process.env.MONGODB_URI || "mongodb+srv://min30032000:2FMlFT3zIq7D0Jtu@cluster0.yct9ofw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    serverApi: ServerApiVersion.v1 
});

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('foodMonster').collection('services');
        const reviewCollection = client.db('foodMonster').collection('reviews');

        if (!serviceCollection || !reviewCollection) {
            console.log("Error: Collections not found");
            // Додайте необхідну обробку помилок тут
        } else {
            console.log("Collections are ready");
        }

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ token });
        });

        app.get('/homeservices', async (req, res) => {
            const query = {};
            const options = {
                sort: { title: 1 }
            };
            const cursor = serviceCollection.find(query, options).limit(3);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/services', async (req, res) => {
            const query = {};
            const options = {
                sort: { title: 1 }
            };
            const cursor = serviceCollection.find(query, options);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: id }; // Використовуємо рядковий ідентифікатор без конвертації
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        });

        app.post('/reviews', async (req, res) => {
            const service = req.body;
            console.log(service);
            const result = await reviewCollection.insertOne(service);
            res.send(result);
        });

        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            console.log('Received ID:', id);  // Додано для логування
            const query = { serviceId: id };
            const cursor = reviewCollection.find(query);
            const review = await cursor.toArray();
            res.send(review);
        });

        app.get('/:id/reviews', async (req, res) => {
            const id = req.params.id;
            const query = { userId: id };
            const cursor = reviewCollection.find(query);
            const userReview = await cursor.toArray();
            res.send(userReview);
        });

        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: id };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        });
    } catch (error) {
        console.error(error);
    }
}

run();

app.listen(PORT, () => {
    console.log('Food Monster is running at port', PORT);
});
