//index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const roomRoutes = require('./routes/roomRoutes');
const userRoutes = require('./routes/userRoutes');
const socket = require('./controllers/socketioController');
const http = require('http');
const app = express();

// Using cors
app.use(express.json());
app.use(cors());

// Main route
app.get('/',(req, res) => {
    res.send('Server works!');
});

// Rooms routes. All routes will be with the room sub-line
app.use('/api/rooms', roomRoutes);
// Users and items
app.use('/api/users', userRoutes);

// Connect to MogoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected!'))
    .catch(err => console.error('Connectivity error',err));

// HTTP server
const server = http.createServer(app);

// Socket.io initialization
socket.init(server);

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
