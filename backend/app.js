const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

// MongoDB connection URI from environment variable
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Check for successful connection
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Your server code
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const initializeGame = require('./game-logic');
const app = express();
const cors = require('cors');
app.use(cors());

app.get('/check', (req, res) => {
  res.send('Hello there, server is up');
});

// Backend flow...

const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (client) => {
  initializeGame(io, client);
});

server.listen(8000);