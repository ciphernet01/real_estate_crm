import express from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import cors from 'cors';
import { JSend } from 'jsend-standard';

import passportConfig from './config/passport.js';
import authController from './controllers/auth.controller.js';
import summaryController from './controllers/summary.controller.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Passport config
passportConfig(passport);

// Express session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// CORS
app.use(cors());

// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// JSend middleware
app.use(JSend.middleware);

// Routes
app.use('/api/auth', authController);
app.use('/api/summary', summaryController);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
