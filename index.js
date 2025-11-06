const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic routes
app.get('/', (req, res) => {
  res.json({
    message: 'Agent Ironman is running!',
    status: 'active',
    version: '1.0.0'
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    agent: 'Agent Ironman',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Agent Ironman is running on http://localhost:${PORT}`);
  console.log(`📍 Install location: ${__dirname}`);
});
