require("dotenv").config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userApi = require('./api/userApi');
const requestApi = require('./api/requestApi');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Routes
app.use('/api/users', userApi);
app.use('/api', requestApi);

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'running',
        service: 'Subscription Management System'
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});