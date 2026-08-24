require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const connectDB = require('./config/db');
const { initFirebase } = require('./config/firebase');
const swaggerSpec = require('./swagger/swagger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const aboutRoutes = require('./routes/aboutRoutes');

const app = express();

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'DocPing API',
    docs: '/api-docs',
    health: '/health',
    api: '/api',
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/about', aboutRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `No route for ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    res.status(400).json({ error: 'Validation Error', message: err.message });
    return;
  }
  if (err.kind === 'ObjectId') {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid id format.' });
    return;
  }
  res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong on the server.' });
});

const start = async () => {
  try {
    await connectDB();
    initFirebase();
    app.listen(PORT,'0.0.0.0', () => {
      console.log(`DocPing backend running on port ${PORT}`);
      console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = app;
