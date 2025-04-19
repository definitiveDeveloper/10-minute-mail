import express from 'express';
import cors from 'cors';
import emailRoute from './src/routes/emailRoute.js'; // Ensure the correct path to emailRoute.js

const app = express();
const PORT = 3001; // You can change this to any available port

// Middleware
app.use(cors());  // Enable CORS to allow frontend to access backend
app.use(express.json());  // Middleware to parse JSON bodies

// Use the email route
app.use('/api', emailRoute);  // The email endpoint is accessible under /api

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
