import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors'; // Import the cors package
import authRoutes from './routes/auth.js';
import programRoutes from './routes/program.js';
import collegeRoutes from './routes/college.js';
import inquiryRoutes from './routes/inquiry.js';
import formRoutes from './routes/forms.js';
import cookieParser from 'cookie-parser';

// Load environment variables
dotenv.config();

const app = express();


// Use CORS middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Parse ALLOWED_ORIGINS from .env as an array
const allowedOrigins = JSON.parse(process.env.ALLOWED_ORIGINS || '[]');

// Configure CORS options
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error('Not allowed by CORS')); // Block the request
    }
  },
  credentials: true, // Allow cookies or authorization headers
};

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to iisdvtc');
});
app.use('/uploads', express.static('uploads'));
app.use('/auth', authRoutes);
app.use('/programs', programRoutes);
app.use('/colleges', collegeRoutes);
app.use('/inquiries', inquiryRoutes);
app.use('/forms', formRoutes)
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});