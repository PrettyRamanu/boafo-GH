require('dotenv').config({ path: '.env.test' });
const express      = require('express');
const cors         = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes    = require('./routes/authRoutes');
const artisanRoutes = require('./routes/artisanRoutes');
const jobRoutes     = require('./routes/jobRoutes');
const miscRoutes    = require('./routes/miscRoutes');
const mlRoutes      = require('./routes/mlRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trim string body values
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') req.body[key] = req.body[key].trim();
    }
  }
  next();
});

app.use('/api/auth',     authRoutes);
app.use('/api/artisans', artisanRoutes);
app.use('/api/jobs',     jobRoutes);
app.use('/api/ml',       mlRoutes);
app.use('/api',          miscRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'Boafo GH API' }));
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));
app.use(errorHandler);

module.exports = app;
