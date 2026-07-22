import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import hostelRoutes from './routes/hostelRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import seatConfigRoutes from './routes/seatConfigRoutes.js';
import meritRoutes from './routes/meritRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import { seedMasterData } from './config/seedMasterData.js';

import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env parameters from local folder first, then fallback to root
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();

// Security and Parsers
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Mount Routing Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/seat-configuration', seatConfigRoutes);
app.use('/api/merit', meritRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'AutoAllot Express server is active.' });
});

// Central Error Middleware
app.use(errorHandler);

// Listen on Port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`[AutoAllot Backend] Server listening on http://localhost:${PORT}`);
  await seedMasterData();
});

export default app;
