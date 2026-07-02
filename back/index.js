//index.js
require('dotenv').config();

process.env.JWT_SK = process.env.JWT_SK || 'dev-secret'

const express = require('express');
const cors = require('cors');
const { pool } = require('./models/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
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
const usersRoutes = require('./routes/usersRoutes');
app.use('/api/users', usersRoutes);
app.use('/api/users', userRoutes);

// Check DB connection
pool.query('SELECT 1')
	.then(() => console.log('Successfully connected!'))
	.catch(err => console.error('Connectivity error', err));

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
