require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB (non-blocking — server starts regardless)
connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`[ParkEase Server]: Running on http://localhost:${PORT}`);
  });
});
