//index.js
require('dotenv').config();

process.env.JWT_SK = process.env.JWT_SK || 'dev-secret'

if (!process.env.MONGO_URI) {
    const mongoHost = process.env.MONGO_HOST || 'mongo';
    const mongoPort = process.env.MONGO_PORT || '27017';
    const mongoDb = process.env.MONGO_DB || 'transcendence';
    process.env.MONGO_URI = `mongodb://${mongoHost}:${mongoPort}/${mongoDb}`;
}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const http = require('http');
const app = express();

// Using cors
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// Main route
app.get('/',(req, res) => {
    res.send('Server works!');
});

app.use('/api/auth', authRoutes);

// Connect to MogoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected!'))
    .catch(err => console.error('Connectivity error',err));

// HTTP server
const server = http.createServer(app);

//Port listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});

// Checking all the routes
app._router.stack.forEach((r) => {
    if(r.route) {
        console.log('Route: ' + r.route.path);
    }
});
