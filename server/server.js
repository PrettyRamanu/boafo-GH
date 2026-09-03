require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const errorHandler = require('./middleware/errorHandler');

const authRoutes    = require('./routes/authRoutes');
const artisanRoutes = require('./routes/artisanRoutes');
const jobRoutes     = require('./routes/jobRoutes');
const miscRoutes    = require('./routes/miscRoutes');
const mlRoutes      = require('./routes/mlRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Trim all string body values
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

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
}

app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Boafo GH server running on port ${PORT}`));
