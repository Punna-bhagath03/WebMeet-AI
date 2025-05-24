require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/ai', aiRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 